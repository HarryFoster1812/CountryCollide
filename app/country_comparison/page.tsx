"use client";

import React, { useEffect, useState } from "react";
import { getCountryData } from "../api/country_api.js";
import {useSearchParams} from "next/navigation";

interface CountryStats {
    name: string;
    population?: number;
    gdpPerCapita?: number;
    landArea?: number;
    flagUrl?: string;
}

interface WorldComparePageProps {
    countryA: string;
    countryB: string;
}

export default function WorldComparePage({}: WorldComparePageProps) {
    const [countries, setCountries] = useState<Record<string, CountryStats>>({});

    const params = useSearchParams();

    const countryA = params.get("a") ?? "Canada";
    const countryB = params.get("b") ?? "United States";

    useEffect(() => {
        getCountryData([countryA, countryB]).then(setCountries);
    }, [countryA, countryB]);

    const renderInfoBox = (title: string, content: React.ReactNode) => (
        <div style={{
            background: "rgba(30, 34, 63, 0.8)",
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
            boxShadow: "0 0 6px rgba(0,0,0,0.3)",
            backdropFilter: "blur(6px)"
        }}>
            <h3 style={{ fontSize: 14, fontWeight: "bold", marginBottom: 6 }}>{title}</h3>
            <div style={{ fontSize: 13 }}>{content}</div>
        </div>
    );

    const renderCountryCard = (name: string) => {
        const data = countries[name];
        if (!data) return null;

        // Prepare stats
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
                <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                    {data?.flagUrl && (
                        <img src={data.flagUrl} alt={`${name} flag`} style={{ width: 50, height: 30, objectFit: "cover", borderRadius: 4, marginRight: 8 }} />
                    )}
                    <h2 style={{ fontSize: 18, fontWeight: "bold" }}>{name}</h2>
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
                        {data.topSongs?.songs
                            ?.slice(0, 5)
                            .map((song, i) => {
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




                {renderInfoBox("Weather", "Average temp, climate type...")}
                {renderInfoBox("Culture", "Languages, traditions, festivals...")}
            </div>
        );
    };



    return (
        <>
            {/* Keyframes injected safely */}
            <style>{`
                @keyframes glowAnim {
                    0% { background-position: 0% 50%; box-shadow: 0 0 6px #ff00ff, 0 0 12px #00ffff, 0 0 18px #ff00ff; }
                    50% { background-position: 100% 50%; box-shadow: 0 0 12px #00ffff, 0 0 18px #ff00ff, 0 0 24px #00ffff; }
                    100% { background-position: 0% 50%; box-shadow: 0 0 6px #ff00ff, 0 0 12px #00ffff, 0 0 18px #ff00ff; }
                }
            `}</style>

            <div style={{ display: "flex", flexDirection: "row", gap: 16, padding: 16, height: "100vh" }}>
                {/* Left Sidebar */}
                {renderCountryCard(countryA)}

                {/* Center Column with Buttons */}
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

                {/* Right Sidebar */}
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
