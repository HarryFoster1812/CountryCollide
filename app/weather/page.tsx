"use client";

import { useState } from "react";

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
  source: string;
  monthlyAverages: MonthlyAverage[];
};

export default function ClimatePage() {
  const [country, setCountry] = useState("");
  const [climate, setClimate] = useState<CountryClimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const fetchClimate = async () => {
    setLoading(true);
    setError(null);
    setClimate(null);

    try {
      const res = await fetch(`/api/weather?country=${encodeURIComponent(country)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch climate data");
        setLoading(false);
        return;
      }

      setClimate(data);
    } catch (err: any) {
      setError(err.message || "Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!climate) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-100 flex flex-col items-center py-12 px-6 space-y-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500 drop-shadow-md">
          🌍 Global Climate Explorer
        </h1>

        <div className="w-full max-w-lg flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Enter a country (e.g. Japan)"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="flex-grow rounded-2xl border border-gray-300 px-5 py-3 text-lg shadow-sm focus:ring-4 focus:ring-blue-300 focus:border-blue-400 transition"
          />
          <button
            onClick={fetchClimate}
            disabled={loading || !country.trim()}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 transition text-white font-semibold px-6 py-3 rounded-2xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Loading..." : "Search"}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 border border-red-300 rounded-xl px-4 py-3 max-w-md text-center shadow-sm">
            {error}
          </div>
        )}
      </main>
    );
  }

  // Prepare data for the chart
  const chartData = climate.monthlyAverages.map((m) => ({
    label: MONTH_NAMES[m.month - 1] ?? `M${m.month}`,
    tempMax: m.avg_high_temp_C,
    tempMin: m.avg_low_temp_C,
    precip: m.avg_precip_mm,
  }));

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-100 flex flex-col items-center py-12 px-6 space-y-8">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500 drop-shadow-md">
        🌍 {climate.country} Climate
      </h1>

      <div className="w-full max-w-5xl">
        <WeatherChart data={chartData} width={800} height={360} />
      </div>
    </main>
  );
}

function WeatherChart({
  data,
  width = 820,
  height = 320,
}: {
  data: { label: string; tempMax: number | null; tempMin: number | null; precip: number | null }[];
  width?: number;
  height?: number;
}) {
  if (!data || data.length === 0) return <div>No chart data.</div>;

  const margin = { top: 20, right: 24, bottom: 50, left: 48 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const temps = data.flatMap((d) => [d.tempMax, d.tempMin].filter((v) => v !== null) as number[]);
  const minTemp = temps.length ? Math.min(...temps) : 0;
  const maxTemp = temps.length ? Math.max(...temps) : 30;

  const precips = data.map((d) => d.precip ?? 0);
  const maxPrecip = Math.max(...precips, 1);

  const n = data.length;
  const xStep = n === 1 ? 0 : innerW / (n - 1);

  const tempToY = (t: number) => {
    if (maxTemp === minTemp) return margin.top + innerH / 2;
    const ratio = (t - minTemp) / (maxTemp - minTemp);
    return margin.top + (1 - ratio) * innerH;
  };

  const precipToH = (p: number) => {
    const maxBarH = innerH * 0.45;
    return (p / maxPrecip) * maxBarH;
  };

  const linePoints = (vals: (number | null)[]) =>
    vals
      .map((v, i) => {
        if (v === null) return null;
        const x = margin.left + i * xStep;
        const y = tempToY(v);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .filter(Boolean)
      .join(" ");

  const maxPts = data.map((d) => d.tempMax);
  const minPts = data.map((d) => d.tempMin);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Weather chart">
      {/* Background */}
      <rect x={0} y={0} width={width} height={height} fill="#fff" rx="4" />

      {/* grid lines for temps */}
      {[0, 0.25, 0.5, 0.75, 1].map((g, idx) => {
        const y = margin.top + g * innerH;
        const tempValue = (1 - g) * (maxTemp - minTemp) + minTemp;
        return (
          <g key={idx}>
            <line x1={margin.left} x2={width - margin.right} y1={y} y2={y} stroke="#eee" strokeWidth={1} />
            <text x={8} y={y + 4} fontSize="11" fill="#666">
              {tempValue.toFixed(0)}°C
            </text>
          </g>
        );
      })}

      {/* precip bars */}
      {data.map((d, i) => {
        const x = margin.left + i * xStep;
        const barW = Math.max(8, xStep * 0.6);
        const precipH = precipToH(d.precip ?? 0);
        const bx = x - barW / 2;
        const by = margin.top + innerH - precipH;
        return <rect key={i} x={bx} y={by} width={barW} height={precipH} fill="#7fb3ff" opacity={0.8} />;
      })}

      {/* tempMax line */}
      <path d={linePoints(maxPts)} fill="none" stroke="#ff6b6b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {/* tempMin line */}
      <path d={linePoints(minPts)} fill="none" stroke="#4a90e2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 4" />

      {/* x labels */}
      {data.map((d, i) => {
        const x = margin.left + i * xStep;
        const y = margin.top + innerH + 20;
        return (
          <text key={i} x={x} y={y} fontSize="11" textAnchor="middle" fill="#333">
            {d.label}
          </text>
        );
      })}

      {/* legend */}
      <g transform={`translate(${width - margin.right - 180}, ${margin.top})`}>
        <rect x={0} y={0} width={180} height={46} rx={6} fill="#fff" stroke="#eee" />
        <g transform="translate(8,10)">
          <rect x={0} y={2} width={12} height={8} fill="#7fb3ff" />
          <text x={18} y={10} fontSize="12" fill="#333">
            Precip (mm)
          </text>

          <line x1={0} x2={12} y1={24} y2={24} stroke="#ff6b6b" strokeWidth={2} />
          <text x={18} y={26} fontSize="12" fill="#333">
            High °C
          </text>

          <line x1={0} x2={12} y1={38} y2={38} stroke="#4a90e2" strokeWidth={2} strokeDasharray="4 4" />
          <text x={18} y={40} fontSize="12" fill="#333">
            Low °C
          </text>
        </g>
      </g>
    </svg>
  );
}
