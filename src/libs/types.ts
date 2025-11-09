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
