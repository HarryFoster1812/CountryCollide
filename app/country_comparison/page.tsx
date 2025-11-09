"use client";

import React, { useEffect, useState } from "react";
import { getCountryData } from "../api/country_api.js";
import { useSearchParams } from "next/navigation";

interface MonthlyAverage {
    month: number;
    avg_high_temp_C: number | null;
    avg_low_temp_C: number | null;
    avg_precip_mm: number | null;
}

interface CountryStats {
    name: string;
    population?: number;
    gdpPerCapita?: number;
    landArea?: number;
    avgEducationYears?: number;
    homicideRate?: number;
    energyUsePerCapita?: number;
    happiness?: number;
    militaryExpenditure?: number;
    electricityAccess?: number;
    flagUrl?: string;
    topSongs?: { songs: any[] };
    monthlyAverages?: MonthlyAverage[];
}

interface WorldComparePageProps {}

export default function WorldComparePage({}: WorldComparePageProps) {
    const [countries, setCountries] = useState<Record<string, CountryStats>>({});
    const [weatherData, setWeatherData] = useState<Record<string, MonthlyAverage[]>>({});

    const params = useSearchParams();
    const countryA = params.get("a") ?? "Canada";
    const countryB = params.get("b") ?? "United States";

    // Fetch country stats
    useEffect(() => {
        getCountryData([countryA, countryB]).then(setCountries);
        fetchWeatherData(countryA);
        fetchWeatherData(countryB);
    }, [countryA, countryB]);

    // Fetch weather data for a country
    const fetchWeatherData = async (country: string) => {
        try {
            const res = await fetch(`/api/weather?country=${country}`);
            const data = await res.json();
            if (data.monthlyAverages) {
                setWeatherData(prev => ({ ...prev, [country]: data.monthlyAverages }));
            }
        } catch (err) {
            console.error(`Error fetching weather data for ${country}:`, err);
        }
    };

    const renderInfoBox = (title: string, content: React.ReactNode) => (
        <div style={{
            background: "rgba(30, 34, 63, 0.8)",
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
            boxShadow: "0 0 6px rgba(0,0,0,0.3)",
            backdropFilter: "blur(6px)"
        }}>
            <h1 style={{fontSize:20, fontWeight: "bold", marginBottom: 5}}>{title}</h1>
            <div style={{ fontSize: 13 }}>{content}</div>
        </div>
    );

    const renderCountryCard = (name: string) => {
        const data = countries[name];
        if (!data) return null;

        const monthly = weatherData[name] ?? [];

        const statsLeft = [
            { label: "Population", value: data.population?.toLocaleString() ?? "N/A" },
            { label: "Land Area (km²)", value: data.landArea?.toLocaleString() ?? "N/A" },
            { label: "GDP per Capita (USD)", value: data.gdpPerCapita?.toLocaleString() ?? "N/A" },
            { label: "Avg Years of Education", value: data.avgEducationYears ?? "N/A" },
            { label: "Homicide Rate (/100,000)", value: data.homicideRate ?? "N/A" },
        ];

        const statsRight = [
            { label: "Energy Use per Capita (KWh)", value: data.energyUsePerCapita ?? "N/A" },
            { label: "Happiness (0-10)", value: data.happiness ?? "N/A" },
            { label: "Military Expenditure (% GDP)", value: data.militaryExpenditure ?? "N/A" },
            { label: "Electricity Access (%)", value: data.electricityAccess ?? "N/A" },
        ];

        const renderWeatherChart = () => {
            if (!monthly.length) return <div>Data Not Found</div>;

            const width = 300;
            const height = 150;
            const padding = 40;

            const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

            const highTemps = monthly.map(m => m.avg_high_temp_C ?? 0);
            const lowTemps = monthly.map(m => m.avg_low_temp_C ?? 0);
            const precipitation = monthly.map(m => m.avg_precip_mm ?? 0);

            const maxTemp = Math.max(...highTemps);
            const minTemp = Math.min(...lowTemps);
            const maxPrecip = Math.max(...precipitation);

            const tempScale = (temp: number) => height - padding - ((temp - minTemp) / (maxTemp - minTemp)) * (height - 2 * padding);
            const precipScale = (precip: number) => height - padding - (precip / maxPrecip) * (height - 2 * padding);

            const tempHighPath = highTemps.map((t, i) => `${(i / 11) * (width - 2 * padding) + padding},${tempScale(t)}`).join(" ");
            const tempLowPath = lowTemps.map((t, i) => `${(i / 11) * (width - 2 * padding) + padding},${tempScale(t)}`).join(" ");
            const precipPath = precipitation.map((p, i) => `${(i / 11) * (width - 2 * padding) + padding},${precipScale(p)}`).join(" ");

            const avgHigh = highTemps.reduce((a,b) => a+b,0)/highTemps.length;
            const avgLow = lowTemps.reduce((a,b) => a+b,0)/lowTemps.length;
            const totalPrecip = precipitation.reduce((a,b) => a+b,0);

            return (
                <div style={{ display: "flex", gap: 8}}>
                    {/* Weather Summary */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ fontSize: 18, flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                            <div>Average Temp: {((avgHigh+avgLow)/2).toFixed(1)}°C</div>
                            <div>High Temp: {Math.max(...highTemps).toFixed(1)}°C</div>
                            <div>Low Temp: {Math.min(...lowTemps).toFixed(1)}°C</div>
                            <div>Total rainfall: {totalPrecip.toFixed(1)} mm</div>
                        </div>
                    </div>

                    {/* Chart with title and legend */}
                    <div style={{ flex: 1 }}>
                        <svg width={width} height={height}>
                            <rect x={0} y={0} width={width} height={height} fill="#1b1f3b" rx={8} />

                            {/* Title */}
                            <text x={width/2} y={20} fill="#fff" fontSize={14} fontWeight="bold" textAnchor="middle">
                                Monthly Weather Overview
                            </text>

                            {/* Legend - moved above plot area */}
                            <g>
                                <rect x={padding} y={25} width={10} height={10} fill="#ff4d4d" />
                                <text x={padding + 15} y={35} fill="#fff" fontSize={10}>High Temp</text>

                                <rect x={padding + 80} y={25} width={10} height={10} fill="#4da6ff" />
                                <text x={padding + 95} y={35} fill="#fff" fontSize={10}>Low Temp</text>

                                <line x1={padding + 160} y1={30} x2={padding + 170} y2={30} stroke="#ffcc00" strokeWidth={2} strokeDasharray="4 2" />
                                <text x={padding + 175} y={35} fill="#fff" fontSize={10}>Precipitation</text>
                            </g>

                            {/* Y-axis labels */}
                            {[minTemp, (minTemp+maxTemp)/2, maxTemp].map((t,i) => (
                                <text key={i} x={padding-5} y={tempScale(t)} fill="#fff" fontSize={10} textAnchor="end">
                                    {t.toFixed(0)}°C
                                </text>
                            ))}

                            {/* X-axis labels */}
                            {months.map((m,i) => (
                                <text key={i} x={(i/11)*(width-2*padding)+padding} y={height-5} fill="#fff" fontSize={10} textAnchor="middle">
                                    {m}
                                </text>
                            ))}

                            {/* High temp line */}
                            <polyline points={tempHighPath} fill="none" stroke="#ff4d4d" strokeWidth={2} />
                            {/* Low temp line */}
                            <polyline points={tempLowPath} fill="none" stroke="#4da6ff" strokeWidth={2} />
                            {/* Precipitation line */}
                            <polyline points={precipPath} fill="none" stroke="#ffcc00" strokeWidth={2} strokeDasharray="4 2" />
                        </svg>
                    </div>
                </div>
            );
        };


        return (
            <div style={{
                flex: 1,
                background: "#0d1226",
                color: "#eaeefb",
                borderRadius: 12,
                border: "1px solid #222",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
                height: "100%"
            }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 20,
                        textAlign: "center",
                    }}
                >
                    {data?.flagUrl && (
                        <img
                            src={data.flagUrl}
                            alt={`${name} flag`}
                            style={{ width: 75, height: 45, objectFit: "cover", borderRadius: 4 }}
                        />
                    )}
                    <h1 style={{ fontSize: 36, fontWeight: "bold", margin: 0 }}>{name}</h1>
                    {data?.flagUrl && (
                        <img
                            src={data.flagUrl}
                            alt={`${name} flag`}
                            style={{ width: 75, height: 45, objectFit: "cover", borderRadius: 4 }}
                        />
                    )}
                </div>

                {renderInfoBox("Stats", (
                    <div style={{ display: "flex", gap: 16 }}>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                            {statsLeft.map((s, i) => (
                                <div key={i}><strong>{s.label}:</strong> {s.value}</div>
                            ))}
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                            {statsRight.map((s, i) => (
                                <div key={i}><strong>{s.label}:</strong> {s.value}</div>
                            ))}
                        </div>
                    </div>
                ))}

                {renderInfoBox("Top Songs", (
                    <ol style={{ paddingLeft: 20, margin: 0 }}>
                        {data.topSongs?.songs?.slice(0, 5).map((song, i) => {
                            const [artist, ...titleParts] = song.rank.split(" - ");
                            const title = titleParts.join(" - ");
                            const isTop1 = i === 0;
                            return (
                                <li
                                    key={i}
                                    style={{
                                        marginBottom: 8,
                                        fontSize: isTop1 ? 16 : 12,
                                        fontWeight: isTop1 ? "bold" : "bold",
                                        color: isTop1 ? "#fffa72" : "#eaeefb",
                                    }}
                                >
                                    <span style={{ marginRight: 8 }}>{i + 1}.</span>
                                    <span style={{ fontStyle: "italic" }}>{title}</span>
                                    {artist ? ` by ${artist}` : ""}
                                </li>
                            );
                        }) || <li>N/A</li>}
                    </ol>
                ))}

                {renderInfoBox("Weather", renderWeatherChart())}

                {renderInfoBox("Culture", "Languages, traditions, festivals...")}
            </div>
        );
    };

    return (
        <>
            <style>{`
                @keyframes glowAnim {
                    0% { background-position: 0% 50%; box-shadow: 0 0 6px #ff00ff, 0 0 12px #00ffff, 0 0 18px #ff00ff; }
                    50% { background-position: 100% 50%; box-shadow: 0 0 12px #00ffff, 0 0 18px #ff00ff, 0 0 24px #00ffff; }
                    100% { background-position: 0% 50%; box-shadow: 0 0 6px #ff00ff, 0 0 12px #00ffff, 0 0 18px #ff00ff; }
                }
            `}</style>

            <div style={{ display: "flex", flexDirection: "row", gap: 16, padding: 16, height: "100vh" }}>
                {renderCountryCard(countryA)}

                <div style={{
                    flex: 0.5,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 24,
                }}>
                    {["Music", "Culture", "Travel"].map((text, i) => (
                        <button key={i} style={glowBtnStyle}>{text}</button>
                    ))}
                </div>

                {renderCountryCard(countryB)}
            </div>
        </>
    );
}

const glowBtnStyle: React.CSSProperties = {
    width: "80%",
    padding: "16px 0",
    borderRadius: 16,
    border: "none",
    fontWeight: "bold",
    fontSize: 16,
    cursor: "pointer",
    color: "#fff",
    background: "linear-gradient(90deg, #ff00ff, #00ffff, #ff00ff)",
    backgroundSize: "200% 200%",
    animation: "glowAnim 3s ease infinite",
    boxShadow: "0 0 6px #ff00ff, 0 0 12px #00ffff, 0 0 18px #ff00ff",
    textShadow: "0 0 3px #fff, 0 0 6px #ff00ff",
};
