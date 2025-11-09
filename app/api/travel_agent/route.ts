import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { TravelPlan } from "@/lib/types"; // Assuming you updated/added this type

// Use the new schema
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
// import { Type } from '@google/generative-ai';

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

export async function POST(req: Request) {
  if (!API_KEY) return NextResponse.json({ error: 'No API key' }, { status: 500 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = TravelInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });

  const { query, history = [], ...input } = parsed.data;

  // ---------- 1. Build the conversation ----------
  const messages: any[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  // If this is the **first** request, create the initial prompt
  if (!query) {
    const firstPrompt = `
Generate a detailed travel itinerary for ${input.traveler_count} traveler(s) going to "${input.destination}" 
from ${input.start_date} to ${input.end_date}.
- Flights from "${input.origin_city}"
- Budget style: **${input.budget_style.toUpperCase()}**
Return **only** a JSON object that exactly matches the schema.
`;
    messages.push({ role: 'user', content: firstPrompt });
  } else {
    // ---------- 2. Follow-up – include history ----------
    // Add all previous turns
    for (const turn of history) {
      messages.push({ role: turn.role === 'user' ? 'user' : 'model', content: turn.content });
    }
    // Add the new user question
    messages.push({ role: 'user', content: query });
  }

try {
  const buildContents = () => {
    const contents: any[] = [];

    // System instruction as first user/model pair
    contents.push({ role: 'user', parts: [{ text: SYSTEM_PROMPT }] });
    contents.push({ role: 'model', parts: [{ text: 'Understood. I will generate the travel plan in the required JSON format.' }] });

    if (!query) {
      const firstPrompt = `
Generate a detailed travel itinerary for ${input.traveler_count} traveler(s) going to "${input.destination}" 
from ${input.start_date} to ${input.end_date}.
- Flights from "${input.origin_city}"
- Budget style: **${input.budget_style.toUpperCase()}**
Return **only** a JSON object that exactly matches the schema.
`.trim();
      contents.push({ role: 'user', parts: [{ text: firstPrompt }] });
    } else {
      for (const turn of history) {
        contents.push({
          role: turn.role === 'user' ? 'user' : 'model',
          parts: [{ text: turn.content }],
        });
      }
      contents.push({ role: 'user', parts: [{ text: query }] });
    }

    return contents;
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: buildContents(),
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
  const newHistory = query
    ? [...history, { role: 'user', content: query }, { role: 'assistant', content: text }]
    : [
        { role: 'user', content: buildContents()[2].parts[0].text },
        { role: 'assistant', content: text },
      ];

  return NextResponse.json({ data: plan, history: newHistory }, { status: 200 });
} catch (error: any) {
  console.error("Gemini API error:", error);
  return NextResponse.json(
    { error: "Failed to generate plan", details: error.message },
    { status: 500 }
  );
}
}
