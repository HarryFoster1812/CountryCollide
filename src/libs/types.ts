import { z } from 'zod';

export interface MergeInput {
  country_a: string;
  country_b: string;
  options?: {
    depth?: 'summary' | 'detailed';
    include_sources?: boolean;
    culture_weight?: number;
    years_forward?: number;
    name_style?: 'portmanteau' | 'neutral' | 'historic';
  };
}

export interface FictionalCountry {
  label: string;
  name: string;
  alt_names: string[];
  summary: string;
  demographics: {
    population: number;
    area_km2: number;
    urbanization_rate: number | null;
    languages: { name: string; share: number | null }[];
    religions: { name: string; share: number | null }[];
  };
  economy: {
    gdp_nominal_usd: number;
    gdp_per_capita_usd: number;
    real_gdp_growth_pct: number;
    sectors_share: {
      agriculture: number;
      industry: number;
      services: number;
    };
    trade_highlights: string[];
  };
  governance: {
    system: string;
    legal_tradition: string;
    stability_score_0_1: number;
  };
  culture: {
    dominant_values: string[];
    fusion_opportunities: string[];
    likely_frictions: string[];
    holiday_calendar_notes: string;
  };
  integration_analysis: {
    compatibility_matrix: {
      feature: string;
      score_0_1: number;
      note: string;
    }[];
    policy_recommendations: string[];
  };
  scenarios_10y: {
    optimistic: Scenario;
    baseline: Scenario;
    pessimistic: Scenario;
  };
  assumptions: string[];
  sources: {
    id: number;
    title: string;
    url: string;
  }[];
}

export interface Scenario {
  pop: number;
  gdp_growth_pct: number;
  stability_0_1: number;
  notes: string;
}


// Replace FictionalCountry with this:
export interface TravelPlan {
    label: 'Travel Itinerary Synthesis';
    destination: string;
    trip_dates: string; // E.g., "From Jan 1st to Jan 7th"
    summary: string; // Overview of the trip plan
    budget_analysis: {
        total_estimated_cost_usd: number;
        cost_breakdown: {
            category: string;
            estimated_cost_usd: number;
            notes: string;
        }[];
    };
    recommended_activities: {
        day: string; // E.g., "Day 1"
        activity: string;
        estimated_cost_usd: number;
        notes: string; // E.g., "Must book tickets online 3 days in advance."
    }[];
    logistics: {
        flights_notes: string;
        accommodation_recommendation: string; // E.g., "Stay near the city center, focusing on the X district."
        visa_or_entry_requirements: string;
        transport_notes: string;
    };
    assumptions: string[]; // List of assumptions made (e.g., flight price, food budget per day)
    sources: {
        id: number;
        title: string;
        url: string;
    }[];
}

// --- Zod Input Schema (New) ---

export const TravelInputSchema = z.object({
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
