import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from 'next/server';
import { z } from 'zod';

// NOTE: Assuming TravelPlan and TravelFormData types are available from your libraries.
// Since external types cannot be guaranteed here, we define a minimal structure for context:
interface TravelPlan {
    label: 'Travel Itinerary Synthesis';
    destination: string;
    trip_dates: string;
    summary: string;
    budget_analysis: {
        total_estimated_cost_usd: number;
        cost_breakdown: Array<{ category: string; estimated_cost_usd: number; notes: string }>;
    };
    recommended_activities: Array<{ day: string; activity: string; estimated_cost_usd: number; notes: string }>;
    logistics: {
        flights_notes: string;
        accommodation_recommendation: string;
        visa_or_entry_requirements: string;
        transport_notes: string;
    };
    assumptions: string[];
    sources: Array<{ id: number; title: string; url: string }>;
}


const TravelInputSchema = z.object({
    destination: z.string().min(1),
    start_date: z.string().min(1),
    end_date: z.string().min(1),
    origin_city: z.string().min(1),
    traveler_count: z.number().int().min(1).default(1),
    budget_style: z.enum(['economy', 'mid-range', 'luxury']).default('mid-range'),
    query: z.string().optional(),
    history: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
    })).optional(),
});

const API_KEY = process.env.GEMINI_API;

if (!API_KEY) {
    console.error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

// Use the new system prompt
const SYSTEM_PROMPT = `
You are an expert, evidence-driven **Travel Research and Planning Model**.
Your job is to:
1. Fetch and summarize current travel data for the specified destination, dates, and budget.
2. Use real-world data to calculate a plausible total estimated cost and a detailed budget breakdown (flights, accommodation, food, activities). State the year/season for all cost estimates.
3. Create a day-by-day itinerary with recommended activities, estimated costs, and essential notes.
4. The itinerary and budget must be tailored to the provided 'budget_style' (economy, mid-range, or luxury).
5. Produce a single, coherent travel plan that strictly adheres to the provided JSON schema.
6. Separate sourced facts from your own assumptions, and list both clearly.

Key Rules:
- Be precise, actionable, and data-driven.
- Cite every non-obvious fact (especially costs, opening times, and specific recommendations) with [n] and include a corresponding entry in the Sources array.
- Never reveal your internal thought process. Summarize your reasoning as findings.
- If data is missing or highly variable, state the gap (e.g., "Cost based on a 3-star hotel" or "Flight price assumes booking 60 days in advance") and proceed with a clearly labeled assumption.
- All final values in the JSON must be **clean numbers** (no currency symbols, no commas).
`.trim();

// Use the new response schema
const TravelPlanSchema = {
    type: Type.OBJECT,
    description: "Structured travel itinerary output.",
    properties: {
        label: {
            type: Type.STRING,
            description: "Must be the literal 'Travel Itinerary Synthesis'.",
            enum: ['Travel Itinerary Synthesis'],
        },
        destination: {
            type: Type.STRING,
            description: "Primary destination for the trip.",
        },
        trip_dates: {
            type: Type.STRING,
            description: `Human-readable date range, e.g., "From Jan 1st to Jan 7th".`,
        },
        summary: {
            type: Type.STRING,
            description: "High-level overview of the trip plan.",
        },

        budget_analysis: {
            type: Type.OBJECT,
            properties: {
                total_estimated_cost_usd: {
                    type: Type.NUMBER,
                    description: "All-in estimated cost in USD.",
                },
                cost_breakdown: {
                    type: Type.ARRAY,
                    description: "Itemized budget by category.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            category: { type: Type.STRING },
                            estimated_cost_usd: { type: Type.NUMBER },
                            notes: { type: Type.STRING },
                        },
                        required: ['category', 'estimated_cost_usd', 'notes'],
                    },
                },
            },
            required: ['total_estimated_cost_usd', 'cost_breakdown'],
        },

        recommended_activities: {
            type: Type.ARRAY,
            description: "Daily activities with notes and estimated costs.",
            items: {
                type: Type.OBJECT,
                properties: {
                    day: {
                        type: Type.STRING,
                        description: `e.g., "Day 1"`,
                    },
                    activity: { type: Type.STRING },
                    estimated_cost_usd: { type: Type.NUMBER },
                    notes: {
                        type: Type.STRING,
                        description: "Tips, booking windows, time sensitivity, etc.",
                    },
                },
                required: ['day', 'activity', 'estimated_cost_usd', 'notes'],
            },
        },

        logistics: {
            type: Type.OBJECT,
            properties: {
                flights_notes: {
                    type: Type.STRING,
                    description: "Routing, airline tips, timing windows.",
                },
                accommodation_recommendation: {
                    type: Type.STRING,
                    description: "Where to stay and why (e.g., near city center / district).",
                },
                visa_or_entry_requirements: {
                    type: Type.STRING,
                    description: "Visas, ESTA/ETA, vaccination notes, entry forms.",
                },
                transport_notes: {
                    type: Type.STRING,
                    description: "Local transport, passes, rideshares, driving rules.",
                },
            },
            required: [
                'flights_notes',
                'accommodation_recommendation',
                'visa_or_entry_requirements',
                'transport_notes',
            ],
        },

        assumptions: {
            type: Type.ARRAY,
            description: "Explicit assumptions used in planning.",
            items: { type: Type.STRING },
        },

        sources: {
            type: Type.ARRAY,
            description: "Citations for prices/rules/schedules used.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.NUMBER },
                    title: { type: Type.STRING },
                    url: { type: Type.STRING },
                },
                required: ['id', 'title', 'url'],
            },
        },
    },

    required: [
        'label',
        'destination',
        'trip_dates',
        'summary',
        'budget_analysis',
        'recommended_activities',
        'logistics',
        'assumptions',
        'sources',
    ],
} as const;

// Helper to construct the contents array for the Gemini API call
const buildContents = (input: z.infer<typeof TravelInputSchema>, query?: string, history: any[] = []) => {
    const contents: any[] = [];
    const roleMap = { user: 'user', assistant: 'model' };

    if (!query) {
        // First turn - generate the initial plan
        const firstPrompt = `
Generate a detailed travel itinerary for ${input.traveler_count} traveler(s) going to "${input.destination}"
from ${input.start_date} to ${input.end_date}.
- Flights from "${input.origin_city}"
- Budget style: **${input.budget_style.toUpperCase()}**
Return **only** a JSON object that exactly matches the schema.
`.trim();
        contents.push({ role: 'user', parts: [{ text: firstPrompt }] });
    } else {
        // Follow-up turn - include history and new query
        for (const turn of history) {
            contents.push({
                // Map 'assistant' to 'model' for the API payload
                role: roleMap[turn.role] || turn.role,
                parts: [{ text: turn.content }],
            });
        }
        // Add the new user question
        contents.push({ role: 'user', parts: [{ text: query }] });
    }

    return contents;
};

export async function POST(req: Request) {
    if (!API_KEY) return NextResponse.json({ error: 'No API key' }, { status: 500 });

    let body: unknown;
    try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const parsed = TravelInputSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });

    const { query, history = [], ...input } = parsed.data;

    // Use a simplified contents array builder that doesn't include the redundant system instruction turns
    const finalContents = buildContents(input, query, history);

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-09-2025",
            contents: finalContents,
            // --- OPTIMIZATION 1: Add Google Search Grounding for evidence-driven facts (required by SYSTEM_PROMPT) ---
            tools: [{ googleSearch: {} }],
            // --- OPTIMIZATION 2: Use dedicated systemInstruction field for faster token processing ---
            systemInstruction: SYSTEM_PROMPT,
            config: {
                responseMimeType: "application/json",
                responseSchema: TravelPlanSchema,
                temperature: 0.4,
            },
        });

        const text = response.text.trim();
        const plan: TravelPlan = JSON.parse(text);

        if (plan.label !== 'Travel Itinerary Synthesis') {
            throw new Error("Model did not return expected label");
        }

        // Build history for next call
        const lastUserContent = finalContents.find(c => c.role === 'user' && c === finalContents[finalContents.length - 1])?.parts[0].text;

        const newHistory = query
            ? [...history, { role: 'user', content: query }, { role: 'assistant', content: text }]
            : [
                { role: 'user', content: lastUserContent || 'Initial plan request' },
                { role: 'assistant', content: text },
            ];


        return NextResponse.json({ data: plan, history: newHistory }, { status: 200 });
    } catch (error: any) {
        console.error("Gemini API error:", error);
        // Include the response text for debugging if available
        const details = error.message || (error.response?.text ? `API Response: ${error.response.text}` : 'Unknown error');
        return NextResponse.json(
            { error: "Failed to generate plan", details },
            { status: 500 }
        );
    }
}
