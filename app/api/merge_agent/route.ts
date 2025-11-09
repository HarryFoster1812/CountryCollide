import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from 'next/server';
import { z } from 'zod';
// Assuming FictionalCountry type is correctly imported from an external library
// import { FictionalCountry } from "@/lib/types"; 

const MergeInputSchema = z.object({
  country_a: z.string().min(1, 'Country A is required.'),
  country_b: z.string().min(1, 'Country B is required.'),
  options: z.object({
    years_forward: z.number().int().min(1).max(50),
    name_style: z.enum(['portmanteau', 'neutral', 'historic']),
  }).optional(),
});


const API_KEY = process.env.GEMINI_API;

if (!API_KEY) {
  console.error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const SYSTEM_PROMPT = `
You are an evidence-driven research and synthesis model that builds plausible, clearly-labeled fictional country profiles formed by merging two real countries.
Your job is to:
1. Fetch and summarize current facts about each source country. For all quantitative data (like GDP, population), use figures for the most recent completed calendar year available and state which year is being used in the 'assumptions'.
2. Model quantitative merges (population, GDP, sectors, area, etc.) using realistic formulas.
3. Reason about cultural blends & clashes without stereotypes, based on sourced data.
4. Produce a single, coherent fictitious country profile that strictly adheres to the provided JSON schema.
5. Separate sourced facts from your own assumptions, and list both clearly.

Key Rules:
- Be concise, neutral, and data-driven. Avoid stereotypes and clichés.
- Cite every non-obvious fact with [n] and include a corresponding entry in the Sources array.
- Never reveal your internal thought process. Summarize your reasoning as findings.
- If data conflicts, report ranges and explain the discrepancy in the assumptions.
- If data is missing, state the gap and proceed with a clearly labeled assumption.
- All numeric merge rules should be listed in the 'assumptions' array. Examples: population_new = pop_A + pop_B; area_new = area_A + area_B; gdp_new = gdp_A + gdp_B; gdp_pc_new = gdp_new / population_new; growth_new = (gdp_A*gr_A + gdp_B*gr_B) / (gdp_A + gdp_B).
- Sector shares should be a GDP-weighted average, renormalized to 100%.
- For cultural synthesis, analyze features like languages, religions, legal traditions, governance, and values. For each, provide a compatibility score, likely policy outcome, fusion opportunities, and friction points. Ground this in sources or label as an assumption.
`.trim();

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    label: { type: Type.STRING, description: "Must be 'Fictional Synthesis'" },
    name: { type: Type.STRING },
    alt_names: { type: Type.ARRAY, items: { type: Type.STRING } },
    summary: { type: Type.STRING },
    demographics: {
      type: Type.OBJECT,
      properties: {
        population: { type: Type.NUMBER },
        area_km2: { type: Type.NUMBER },
        urbanization_rate: { type: Type.NUMBER, nullable: true },
        languages: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              share: { type: Type.NUMBER, nullable: true },
            },
            required: ['name', 'share'],
          },
        },
        religions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              share: { type: Type.NUMBER, nullable: true },
            },
            required: ['name', 'share'],
          },
        },
      },
      required: ['population', 'area_km2', 'urbanization_rate', 'languages', 'religions'],
    },
    economy: {
      type: Type.OBJECT,
      properties: {
        gdp_nominal_usd: { type: Type.NUMBER },
        gdp_per_capita_usd: { type: Type.NUMBER },
        real_gdp_growth_pct: { type: Type.NUMBER },
        sectors_share: {
          type: Type.OBJECT,
          properties: {
            agriculture: { type: Type.NUMBER },
            industry: { type: Type.NUMBER },
            services: { type: Type.NUMBER },
          },
          required: ['agriculture', 'industry', 'services'],
        },
        trade_highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['gdp_nominal_usd', 'gdp_per_capita_usd', 'real_gdp_growth_pct', 'sectors_share', 'trade_highlights'],
    },
    governance: {
      type: Type.OBJECT,
      properties: {
        system: { type: Type.STRING },
        legal_tradition: { type: Type.STRING },
        stability_score_0_1: { type: Type.NUMBER },
      },
      required: ['system', 'legal_tradition', 'stability_score_0_1'],
    },
    culture: {
      type: Type.OBJECT,
      properties: {
        dominant_values: { type: Type.ARRAY, items: { type: Type.STRING } },
        fusion_opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
        likely_frictions: { type: Type.ARRAY, items: { type: Type.STRING } },
        holiday_calendar_notes: { type: Type.STRING },
      },
      required: ['dominant_values', 'fusion_opportunities', 'likely_frictions', 'holiday_calendar_notes'],
    },
    integration_analysis: {
      type: Type.OBJECT,
      properties: {
        compatibility_matrix: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              feature: { type: Type.STRING },
              score_0_1: { type: Type.NUMBER },
              note: { type: Type.STRING },
            },
            required: ['feature', 'score_0_1', 'note'],
          },
        },
        policy_recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['compatibility_matrix', 'policy_recommendations'],
    },
    scenarios_10y: {
      type: Type.OBJECT,
      properties: {
        optimistic: {
          type: Type.OBJECT,
          properties: {
            pop: { type: Type.NUMBER },
            gdp_growth_pct: { type: Type.NUMBER },
            stability_0_1: { type: Type.NUMBER },
            notes: { type: Type.STRING },
          },
          required: ['pop', 'gdp_growth_pct', 'stability_0_1', 'notes'],
        },
        baseline: {
          type: Type.OBJECT,
          properties: {
            pop: { type: Type.NUMBER },
            gdp_growth_pct: { type: Type.NUMBER },
            stability_0_1: { type: Type.NUMBER },
            notes: { type: Type.STRING },
          },
          required: ['pop', 'gdp_growth_pct', 'stability_0_1', 'notes'],
        },
        pessimistic: {
          type: Type.OBJECT,
          properties: {
            pop: { type: Type.NUMBER },
            gdp_growth_pct: { type: Type.NUMBER },
            stability_0_1: { type: Type.NUMBER },
            notes: { type: Type.STRING },
          },
          required: ['pop', 'gdp_growth_pct', 'stability_0_1', 'notes'],
        },
      },
      required: ['optimistic', 'baseline', 'pessimistic'],
    },
    assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
    sources: {
      type: Type.ARRAY,
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
    'label', 'name', 'alt_names', 'summary', 'demographics', 'economy',
    'governance', 'culture', 'integration_analysis', 'scenarios_10y',
    'assumptions', 'sources'
  ],
};


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

  const parsed = MergeInputSchema.safeParse(body);
  if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request payload.', details: parsed.error.format() }, { status: 400 });
  }

  const input = parsed.data;

  // Dynamically set scenario horizon based on input
  const scenarioHorizon = input.options?.years_forward ?? 10; 


  const userPrompt = `
Create a fictional merged country from "${input.country_a}" and "${input.country_b}".

Requirements:
- Use current stats (latest complete year) for all metrics.
- Explain cultural synergies and frictions using sourced descriptions.
- Apply the numeric merge rules and report the formulas used in the "assumptions" array.
- Provide 3 name options in 'alt_names' and pick one as primary 'name', respecting the requested name_style.
- Set the horizon for scenarios to ${scenarioHorizon} years forward.

Inputs (JSON):
${JSON.stringify(input, null, 2)}

Output:
Return exactly one JSON object that matches the required schema. Include [n] inline citation markers in your text descriptions and a corresponding "sources" array mapping those numbers to URLs/titles.
`.trim();

  try {
    const response = await ai.models.generateContent({
      // --- PERFORMANCE IMPROVEMENT: Switch to Flash Model ---
      model: "gemini-2.5-flash-preview-09-2025", 
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.4,
        // --- PERFORMANCE IMPROVEMENT: Explicitly enable search grounding ---
        tools: [{ google_search: {} }], 
      },
    });

    const text = response.text.trim();
    // Casting to any type for compatibility since FictionalCountry is not defined here
    const data: any = JSON.parse(text); 

    if (data?.label !== 'Fictional Synthesis') {
      throw new Error("Model returned an unexpected object shape.");
    }
    
    return NextResponse.json({ data }, { status: 200 });

  } catch (error: any) {
    console.error("Gemini API call failed:", error);
    let errorMessage = "Failed to generate country profile from the AI model.";
    if (error instanceof Error && error.message.includes('SAFETY')) {
         errorMessage = "The request was blocked due to safety settings. Please try different country names.";
    }
    return NextResponse.json({ error: errorMessage, details: error.message }, { status: 500 });
  }
}
