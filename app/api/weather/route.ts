import { NextResponse } from "next/server";
import climateData from "./global_monthly_climate.json";

type MonthlyAverage = {
  month: number;
  avg_high_temp_C: number | null;
  avg_low_temp_C: number | null;
  avg_precip_mm: number | null;
};

type CountryClimate = {
  country: string;
  latitude: number | null;
  longitude: number | null;
  monthly_averages: MonthlyAverage[];
  source?: string;
};

const climateIndex = new Map<string, CountryClimate>();
(climateData as CountryClimate[]).forEach((entry) => {
  if (entry?.country) {
    climateIndex.set(entry.country.toLowerCase(), entry);
  }
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");

    if (!country) {
      return NextResponse.json(
        { error: "Missing required query parameter: country" },
        { status: 400 }
      );
    }

    const lookup = climateIndex.get(country.toLowerCase());

    if (!lookup || !Array.isArray(lookup.monthly_averages)) {
      return NextResponse.json(
        { error: `No climate data found for '${country}'` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        country: lookup.country,
        latitude: lookup.latitude,
        longitude: lookup.longitude,
        source: lookup.source ?? "compiled",
        monthlyAverages: lookup.monthly_averages,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Unexpected server error", message: err?.message || String(err) },
      { status: 500 }
    );
  }
}