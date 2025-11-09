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
  iso: string;
  latitude: number | null;
  longitude: number | null;
  monthly_averages: MonthlyAverage[];
  source?: string;
};

const climateIndex = new Map<string, CountryClimate>();
(climateData as CountryClimate[]).forEach((entry) => {
  if (entry?.iso) {
    climateIndex.set(entry.iso, entry);
  }
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const iso = searchParams.get("iso");

    if (!iso) {
      return NextResponse.json(
        { error: "Missing required query parameter: iso" },
        { status: 400 }
      );
    }

    const lookup = climateIndex.get(iso);

    if (!lookup || !Array.isArray(lookup.monthly_averages)) {
      return NextResponse.json(
        { error: `No climate data found for '${iso}'` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        country: lookup.country,
        iso: lookup.iso,
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