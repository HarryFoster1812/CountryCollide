"use client";

import React, { useEffect, useState } from "react";
import { getCountryData } from "../api/country_api.js";

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

export default function WorldComparePage({ countryA = "United States", countryB = "Japan" }: WorldComparePageProps) {
    const [countries, setCountries] = useState<Record<string, CountryStats>>({});

    useEffect(() => {
        getCountryData([countryA, countryB]).then(setCountries);
    }, [countryA, countryB]);

    const renderCountryCard = (name: string) => {
        const data = countries[name];
        return (
            <div style={{
                flex: 1,
                background: "#0d1226",
                color: "#eaeefb",
                borderRadius: 8,
                border: "1px solid #222",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 8,
            }}>
                <h2 style={{ fontWeight: "bold" }}>{name}</h2>
                {data?.flagUrl && (
                    <img src={data.flagUrl} alt={`${name} flag`} style={{ width: 80, height: 50, objectFit: "cover", borderRadius: 4 }} />
                )}
                <div style={{ fontSize: 14 }}>
                    <div>Population: {data?.population?.toLocaleString() ?? "N/A"}</div>
                    <div>Land Area: {data?.landArea?.toLocaleString() ?? "N/A"} km²</div>
                    <div>GDP per Capita: {data?.gdpPerCapita?.toLocaleString() ?? "N/A"} USD</div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: 16 }}>
            {/* Countries */}
            <div style={{ display: "flex", gap: 16 }}>
                {renderCountryCard(countryA)}
                {/* Buttons in the middle */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                    <button style={btnStyle}>Music</button>
                    <button style={btnStyle}>Culture</button>
                    <button style={btnStyle}>Travel</button>
                </div>
                {renderCountryCard(countryB)}
            </div>
        </div>
    );
}

const btnStyle: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #2b3157",
    background: "#131938",
    color: "white",
    cursor: "pointer",
};
