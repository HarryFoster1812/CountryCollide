import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

// Ensure your environment variables are configured.
const API_KEY = process.env.GEMINI_API;

if (!API_KEY) {
  console.error("GEMINI_API_KEY environment variable is not set.");
}

// Initialize the Google Gen AI client
const ai = new GoogleGenAI({ apiKey: API_KEY! });

interface Stats {
  lifeExpectancy: number;
  healthcareAccess: string;
  mentalHealthIndex: number;
  pollutionIndex?: number;
  vaccinationRate?: number;
  obesityRate?: number;
}

// Mock real-world stats (replace with WHO/World Bank APIs in production)
const MOCK_STATS: Record<string, Stats> = {
  Canada: { lifeExpectancy: 82.3, healthcareAccess: "High", mentalHealthIndex: 78 },
  "United States": { lifeExpectancy: 77.2, healthcareAccess: "Medium", mentalHealthIndex: 72 },
  Sweden: { lifeExpectancy: 83.0, healthcareAccess: "High", mentalHealthIndex: 80 },
  Japan: { lifeExpectancy: 84.8, healthcareAccess: "High", mentalHealthIndex: 75 },
  Brazil: { lifeExpectancy: 75.9, healthcareAccess: "Medium", mentalHealthIndex: 68 },
};

export async function POST(req: NextRequest) {
  // Check for API Key first
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'Server configuration error: GEMINI_API_KEY is missing.' },
      { status: 500 }
    );
  }

  try {
    const { country } = await req.json();
    if (!country) return NextResponse.json({ error: "Missing country" }, { status: 400 });

    // Fetch mock stats for the country
    const stats = MOCK_STATS[country] ?? {
      lifeExpectancy: 76,
      healthcareAccess: "Medium",
      mentalHealthIndex: 70,
    };

    // Construct the detailed prompt
    const prompt = `
You are a public-health AI expert. Generate a **Health & Wellbeing Report** for **${country}** in **Markdown**.

Use these stats:
- Life Expectancy: ${stats.lifeExpectancy} years
- Healthcare Access: ${stats.healthcareAccess}
- Mental Health Index: ${stats.mentalHealthIndex}/100

Include:
1. **Overview** – Current state
2. **Key Challenges & Opportunities** – 2–3 evidence-based insights
3. **Model Comparisons** – e.g., "If ${country} adopted Sweden’s universal primary care, life expectancy could rise by 3–5 years (WHO 2024)"
4. **Traveler/Tourist Health Guide** – Long-term benefits & risks:
   - Benefits: e.g., vitamin D, gut microbiome diversity, stress reduction
   - Risks: e.g., dengue, pollution, foodborne illness
   - Precautions: vaccines, water, air quality
5. **Actionable Tips** – For residents and visitors

Keep it **engaging, 600–900 words**, use **bullet points**, **bold**, and **emojis**.
**Return ONLY the Markdown string, nothing else.**
End with:
> _This is AI-generated for informational purposes. Not medical advice._
`;

    // Call the Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro', // Using a capable model
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        // Setting a temperature higher than default for creativity in report generation
        temperature: 0.7,
        // Note: Max tokens is generally handled by the model context, but we can rely on the length request in the prompt
      },
    });

    // Extract the generated Markdown text
    const report = response.text.trim() || "Failed to generate report.";

    return NextResponse.json({ report, stats });

  } catch (error: any) {
    console.error("Gemini API call for Health report failed:", error);

    let errorMessage = "Internal error generating the report.";
    if (error.message && error.message.includes('API key')) {
      errorMessage = "Authentication Error: The provided GEMINI_API_KEY may be invalid.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
