import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { TravelPlan } from "@/lib/types"; // Assuming you updated/added this type

// Use the new schema
const TravelInputSchema = z.object({
  destination: z.string().min(1, 'Destination is required.'),
  start_date: z.string().min(1, 'Start date is required (e.g., YYYY-MM-DD).'),
  end_date: z.string().min(1, 'End date is required (e.g., YYYY-MM-DD).'),
  origin_city: z.string().min(1, 'Origin city is required for flight cost estimation.'),
  traveler_count: z.number().int().min(1).default(1),
  budget_style: z.enum(['economy', 'mid-range', 'luxury']).default('mid-range'),
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
const TravelPlanSchema = { /* ... (The JSON object for the TravelPlanSchema from Section 3) ... */ }; 
// NOTE: You must paste the full TravelPlanSchema object here in your actual code

export async function POST(req: Request) {
  if (!API_KEY) {
      return NextResponse.json({ error: 'Server is not configured with an API key.' }, { status: 500 });
  }

  let body: unknown;
  try {
      body = await req.json();
  } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = TravelInputSchema.safeParse(body);
  if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request payload.', details: parsed.error.format() }, { status: 400 });
  }

  const input = parsed.data;

  const userPrompt = `
Generate a detailed travel itinerary for ${input.traveler_count} traveler(s) going to "${input.destination}" from ${input.start_date} to ${input.end_date}.

Requirements:
- The flight cost must be estimated from "${input.origin_city}".
- The entire plan (activities, lodging, food) must adhere to a **${input.budget_style.toUpperCase()}** budget style.
- Calculate the total estimated cost in USD and provide a detailed breakdown.
- Create a day-by-day recommended activities list.

Inputs (JSON):
${JSON.stringify(input, null, 2)}

Output:
Return exactly one JSON object that matches the required schema. Include [n] inline citation markers in your text descriptions and a corresponding "sources" array mapping those numbers to URLs/titles.
`.trim();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: TravelPlanSchema, // Use the new schema
        temperature: 0.4,
      },
    });

    const text = response.text.trim();
    const data: TravelPlan = JSON.parse(text); // Use the new type

    if (data?.label !== 'Travel Itinerary Synthesis') {
      throw new Error("Model returned an unexpected object shape or label.");
    }
    
    return NextResponse.json({ data }, { status: 200 });

  } catch (error: any) {
    console.error("Gemini API call failed:", error);
    let errorMessage = "Failed to generate travel plan from the AI model.";
    if (error instanceof Error && error.message.includes('SAFETY')) {
         errorMessage = "The request was blocked due to safety settings. Please try different parameters.";
    }
    return NextResponse.json({ error: errorMessage, details: error.message }, { status: 500 });
  }
}
