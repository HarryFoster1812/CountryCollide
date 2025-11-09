"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as topojson from "topojson-client";
import * as d3geo from "d3-geo";
import { getCountryData } from "../api/country_api.js";
import Link from "next/link";

// If you place this file under app/globe/page.tsx, export default the page.
// If you place it under components/, export the component and render it from a page.
export default function CountrySelectorGlobePage() {
    const [height, setHeight] = useState(600); // fallback height before window loads

    useEffect(() => {
        const handleResize = () => setHeight(window.innerHeight - 30);
        handleResize(); // set initial height
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div style={{ padding: 16 }}>
            <CountrySelectorGlobe height={620} />
        </div>
    );
}

let isoMapPromise: Promise<Record<string, string>> | null = null;

async function getIsoMap(): Promise<Record<string, string>> {
  if (!isoMapPromise) {
    isoMapPromise = (async () => {
      const res = await fetch("/iso_mapping.json");
      if (!res.ok) return {};
      return (await res.json()) as Record<string, string>;
    })();
  }
  return isoMapPromise;
}

/**
 * Convert a country label to ISO-2.
 * - If the input already looks like ISO-2, return it uppercased.
 * - Otherwise look it up in /iso_mapping.json.
 * - Returns null if no match.
 */
export async function countryNameToISO2(name: string): Promise<string | null> {
  if (!name) return null;
  const trimmed = name.trim();

  // If it's already ISO-2, accept it
  if (/^[A-Za-z]{2}$/.test(trimmed)) return trimmed.toUpperCase();

  const mapping = await getIsoMap();
  // Try exact, then case-insensitive
  if (mapping[trimmed]) return String(mapping[trimmed]).toUpperCase();

  const lowerKey = Object.keys(mapping).find((k) => k.toLowerCase() === trimmed.toLowerCase());
  return lowerKey ? String(mapping[lowerKey]).toUpperCase() : null;
}

// Types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Feature = any;

function CountrySelectorGlobe({
    // height = typeof window !== "undefined" ? window.innerHeight : 600,
    globeBackgroundColor = "#0b1020",
    geojsonUrl = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson",
}: {
        height?: number;
        globeBackgroundColor?: string;
        geojsonUrl?: string;
    }) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const globeRef = useRef<any>(null);
    const [features, setFeatures] = useState<Feature[]>([]);
    // Changed selected from Set<string> to string[] to maintain order for FIFO
    const [selected, setSelected] = useState<string[]>([]); // Use array to maintain selection order
    const [search, setSearch] = useState("");
    const [matchesOpen, setMatchesOpen] = useState(false);
    const [countryData, setCountryData] = useState<any>({});

    const [a, setA] = useState<string>("");
    const [b, setB] = useState<string>("");

    const [height, setHeight] = useState(600); // default fallback

    useEffect(() => {
        const updateHeight = () => setHeight(window.innerHeight-30);
        updateHeight(); // set immediately
        window.addEventListener("resize", updateHeight);
        return () => window.removeEventListener("resize", updateHeight);
    }, []);

    // --- Load country polygons (handles GeoJSON or TopoJSON) ---
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const res = await fetch(geojsonUrl);
            const data = await res.json();
            let geojson: any;
            if (data.type === "Topology") {
                const obj =
                    data.objects?.countries ||
                        data.objects?.land ||
                        Object.values(data.objects || {})[0];
                geojson = topojson.feature(data, obj as any);
            } else {
                geojson = data;
            }
            const feats = (geojson.features || []).map((f: any) => ({
                ...f,
                properties: {
                    ...f.properties,
                    name:
                    f.properties?.name_long ||
                        f.properties?.ADMIN ||
                        f.properties?.name ||
                        f.properties?.NAME ||
                        f.id ||
                        "Unknown",
                },
            }));
            if (!cancelled) setFeatures(feats);
        })();
        return () => {
            cancelled = true;
        };
    }, [geojsonUrl]);

    // --- Build globe (client-only dynamic import) ---
    useEffect(() => {
        if (!containerRef.current || features.length === 0) return;
        let cleanupResize: (() => void) | undefined;
        (async () => {
            const GlobeJS = (await import("globe.gl")).default;
            const globe = GlobeJS()(containerRef.current)
            .width(containerRef.current.clientWidth)
            .height(height)
            .backgroundColor(globeBackgroundColor)
            .showAtmosphere(true)
            .atmosphereAltitude(0.25)
            .globeImageUrl("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
            .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
            .polygonsData(features)
            // --- BEST LOOK: border + translucent fill + slight lift when selected ---
            .polygonCapColor((d: Feature) =>
                selected.includes(getCountryKey(d)) ? "rgba(255, 204, 0, 0.35)" : "rgba(0,0,0,0)"
            )
            .polygonSideColor(() => "rgba(0,0,0,0)")
            .polygonStrokeColor((d: Feature) =>
                selected.includes(getCountryKey(d)) ? "#ffcc00" : "rgba(255,255,255,0.35)"
            )
            .polygonAltitude((d: Feature) => (selected.includes(getCountryKey(d)) ? 0.02 : 0.004))
            .polygonsTransitionDuration(300)
            .onPolygonClick((poly: Feature) => {
                toggleSelection(poly);
                const [lng, lat] = getFeatureCentroid(poly);
                globe.pointOfView({ lat, lng, altitude: 1.5 }, 800);
            })
            .onPolygonHover((poly: Feature | null) => {
                globe.polygonStrokeColor((d: Feature) => {
                    if (selected.includes(getCountryKey(d))) return "#ffcc00";
                    if (poly && getCountryKey(poly) === getCountryKey(d)) return "#ffffff";
                    return "rgba(255,255,255,0.35)";
                });
            });
            const onResize = () => {
                if (!containerRef.current) return;
                globe.width(containerRef.current.clientWidth);
                globe.height(height);
            };
            window.addEventListener("resize", onResize);
            cleanupResize = () => window.removeEventListener("resize", onResize);
            globeRef.current = globe;
        })();
        return () => {
            cleanupResize?.();
            globeRef.current = null; // letting canvas unmount is fine
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [features, height, globeBackgroundColor]);

    // --- Keep visuals in sync whenever selection changes ---
    useEffect(() => {
        if (!globeRef.current) return;
        globeRef.current
            .polygonCapColor((d: Feature) =>
                selected.includes(getCountryKey(d)) ? "rgba(255, 204, 0, 0.35)" : "rgba(0,0,0,0)"
            )
            .polygonStrokeColor((d: Feature) =>
                selected.includes(getCountryKey(d)) ? "#ffcc00" : "rgba(255,255,255,0.35)"
            )
            .polygonAltitude((d: Feature) => (selected.includes(getCountryKey(d)) ? 0.02 : 0.004));
    }, [selected]); // Dependency array updated to `selected`

    // --- utils ---
    const getCountryKey = (f: Feature) => (f?.properties?.name || "").toLowerCase().trim();

    const toggleSelection = useCallback((featureOrName: Feature | string) => {
        setSelected((prevSelected) => {
            const key = typeof featureOrName === "string"
                ? featureOrName.toLowerCase().trim()
                : getCountryKey(featureOrName);

            const newSelected = [...prevSelected];
            const index = newSelected.indexOf(key);

            if (index > -1) {
                // Country is already selected, unselect it
                newSelected.splice(index, 1);
            } else {
                // Country is not selected
                if (newSelected.length >= 2) {
                    // If 2 countries already selected, remove the first one (FIFO)
                    newSelected.shift();
                }
                // Add the new country
                newSelected.push(key);
            }
            return newSelected;
        });
    }, []); // useCallback with empty dependency array for stable reference

    const getFeatureCentroid = (feature: Feature) => {
        try {
            const [lng, lat] = d3geo.geoCentroid(feature);
            return [lng, lat] as [number, number];
        } catch {
            const [minLng, minLat, maxLng, maxLat] = feature?.bbox || [-10, 0, 10, 0];
            return [(minLng + maxLng) / 2, (minLat + maxLat) / 2] as [number, number];
        }
    };

    // --- derived data for search/list ---
    const allNames = useMemo(
        () =>
            features
            .map((f) => f.properties?.name)
            .filter(Boolean)
            .sort((a: string, b: string) => a.localeCompare(b)),
        [features]
    );

    const filteredNames = useMemo(() => {
        const term = search.toLowerCase().trim();
        if (!term) return allNames.slice(0, 50);
        const starts: string[] = [];
        const includes: string[] = [];
        for (const n of allNames) {
            const ln = n.toLowerCase();
            if (ln.startsWith(term)) starts.push(n);
                else if (ln.includes(term)) includes.push(n);
        }
        return [...starts, ...includes].slice(0, 50);
    }, [search, allNames]);

    const selectedNames = useMemo(() => {
        // Map selected keys back to original names for display, maintaining order
        const nameMap = new Map(allNames.map((n) => [n.toLowerCase(), n]));
        return selected
            .map((key) => nameMap.get(key))
            .filter(Boolean) as string[];
    }, [selected, allNames]); // Dependency array updated to `selected`

    const jumpToCountry = (name: string, { toggle = true } = {}) => {
        const key = name.toLowerCase().trim();
        const feat = features.find((f) => getCountryKey(f) === key);
        if (!feat) return;
        if (toggle) toggleSelection(feat);
        const [lng, lat] = getFeatureCentroid(feat);
        globeRef.current?.pointOfView({ lat, lng, altitude: 1.5 }, 800);
    };

    useEffect(() => {
        // Pass `selectedNames` directly to getCountryData
        getCountryData(selectedNames).then(setCountryData);
    }, [selectedNames]); // Depend on `selectedNames` for fetching country data

    // helpers for flags/data
    const codeFor = (name: string) => {
        const feat = features.find(
            (f) => (f.properties?.name || "").toLowerCase() === name.toLowerCase()
        );
        const fromFeat = feat?.properties?.iso_a2;
        const fromData = countryData?.[name]?.code;
        return (fromFeat || fromData || "").toString().toUpperCase();
    };

    const fmt = (n?: number, opts: Intl.NumberFormatOptions = {}) =>
        typeof n === "number" ? n.toLocaleString(undefined, opts) : "—";


  useEffect(() => {
    let mounted = true;
    (async () => {
      const [ra, rb] = await Promise.all([
        countryNameToISO2(selectedNames[0]),
        countryNameToISO2(selectedNames[1]),
      ]);
      if (mounted) {
        setA(ra ?? "");
        setB(rb ?? "");
      }
    })();
    return () => { mounted = false; };
  }, [selectedNames]);

    // --- UI ---
    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 12 }}>
            {/* Globe */}
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height,
                    borderRadius: 8,
                    overflow: "hidden",
                    background: globeBackgroundColor,
                }}
            />

            {/* Side panel */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    height,
                    maxHeight: height,
                    overflow: "hidden",
                    borderRadius: 8,
                    border: "1px solid #222",
                    background: "#0d1226",
                    color: "#eaeefb",
                    padding: 12,
                    boxSizing: "border-box",
                    position: "relative",
                }}
            >
                <div>
                    <label htmlFor="country-search" style={{ fontSize: 12, opacity: 0.8, display: "block", marginBottom: 6 }}>
                        Search & add countries
                    </label>
                    <input
                        id="country-search"
                        placeholder="Type to search (e.g., France)…"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setMatchesOpen(true);
                        }}
                        onFocus={() => setMatchesOpen(true)}
                        onBlur={() => setTimeout(() => setMatchesOpen(false), 120)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && filteredNames[0]) {
                                jumpToCountry(filteredNames[0], { toggle: true });
                                setSearch("");
                            }
                        }}
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: "1px solid #2b3157",
                            outline: "none",
                            background: "#0b1020",
                            color: "white",
                        }}
                    />
                    {matchesOpen && filteredNames.length > 0 && (
                        <div
                            role="listbox"
                            style={{
                                position: "absolute",
                                width: 336,
                                maxHeight: 260,
                                marginTop: 6,
                                overflowY: "auto",
                                background: "#0b1020",
                                border: "1px solid #2b3157",
                                borderRadius: 8,
                                zIndex: 2,
                                boxShadow: "0 6px 24px rgba(0,0,0,0.4)",
                            }}
                        >
                            {filteredNames.map((name) => {
                                const isSelected = selected.includes(name.toLowerCase()); // Use .includes() for array
                                return (
                                    <div
                                        key={name}
                                        role="option"
                                        aria-selected={isSelected}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                            jumpToCountry(name, { toggle: true });
                                            setSearch("");
                                        }}
                                        style={{
                                            padding: "8px 12px",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            background: isSelected ? "#17204a" : "transparent",
                                        }}
                                    >
                                        <span>{name}</span>
                                        <span
                                            style={{
                                                fontSize: 11,
                                                opacity: 0.7,
                                                border: "1px solid #2b3157",
                                                padding: "2px 6px",
                                                borderRadius: 999,
                                            }}
                                        >
                                            {isSelected ? "Selected" : "Add"}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: selectedNames.length == 2 ? '1fr 1fr' : '1fr',
                        gap: 8,
                        alignItems: 'stretch',
                    }}
                >
                    <button
                        onClick={() => setSelected([])}
                        style={btnStyle}
                        title="Clear all"
                    >
                        Clear all
                    </button>

                    {selectedNames.length == 2 && (
                        <Link
                            href={`/country_comparison?a=${a}&b=${b}`}
                            style={{ display: 'block' }} // make the link fill its grid cell
                            title="Compare the two selected countries"
                        >
                            <button style={btnStyle}>Compare</button>
                        </Link>
                    )}
                </div>

                <div style={{ fontSize: 12, opacity: 0.85 }}>Selected ({selectedNames.length})</div>

                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        border: "1px solid #2b3157",
                        borderRadius: 8,
                        padding: 8,
                        background: "#0b1020",
                    }}
                >
                    {selectedNames.length === 0 ? (
                        <div style={{ opacity: 0.6, fontSize: 14 }}>
                            No countries selected. Click on the globe or use the search box.
                        </div>
                    ) : (
                            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                                {selectedNames.map((name) => (
                                    <li
                                        key={name}
                                        style={{
                                            display: "flex",
                                            alignItems: "stretch",
                                            justifyContent: "space-between",
                                            padding: "10px",
                                            borderBottom: "1px dashed #20264a",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "row",
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                                background: "#17204a",
                                                borderRadius: "10px",
                                                color: "#fff",
                                                padding: "12px 16px",
                                                width: "100%",
                                                position: "relative",
                                            }}
                                        >
                                            {/* Left side: name + stats */}
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: "bold", fontSize: 18, marginBottom: 8 }}>{name}</div>
                                                <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                                                    <div>Population: {countryData[name]?.population ?? "N/A"}</div>
                                                    <div>Area: {countryData[name]?.landArea ?? "N/A"} km²</div>
                                                    <div>GDP: ${countryData[name]?.gdpPerCapita?.toLocaleString?.() ?? "N/A"}</div>
                                                </div>
                                            </div>

                                            {/* Top-right: flag */}
                                            {countryData[name]?.flagUrl && (
                                                <img
                                                    src={countryData[name].flagUrl}
                                                    alt={`${name} flag`}
                                                    style={{
                                                        width: 100,
                                                        height: 60,
                                                        objectFit: "cover",
                                                        borderRadius: 6,
                                                        marginLeft: 16,
                                                        boxShadow: "0 0 8px rgba(0, 0, 0, 0.3)",
                                                    }}
                                                />
                                            )}

                                            {/* Bottom-right: button */}
                                            <button
                                                onClick={() => {
                                                    const feat = features.find(
                                                        (f) => (f.properties?.name || "").toLowerCase() === name.toLowerCase()
                                                    );
                                                    if (!feat) return;
                                                    const [lng, lat] = getFeatureCentroid(feat);
                                                    globeRef.current?.pointOfView({ lat, lng, altitude: 1.5 }, 800);
                                                }}
                                                title="Go to"
                                                style={{
                                                    position: "absolute",
                                                    right: 16,
                                                    bottom: 12,
                                                    padding: "6px 12px",
                                                    background: "#0b1a3b",
                                                    border: "none",
                                                    borderRadius: 6,
                                                    cursor: "pointer",
                                                    color: "#fff",
                                                    fontSize: 13,
                                                    transition: "background 0.2s ease",
                                                }}
                                                onMouseOver={(e) => ((e.target as HTMLButtonElement).style.background = "#122c68")}
                                                onMouseOut={(e) => ((e.target as HTMLButtonElement).style.background = "#0b1a3b")}
                                            >
                                                Go to
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                </div>
            </div>
        </div>
    );
}

const btnStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #2b3157',
    background: 'linear-gradient(180deg, #1b2456 0%, #131938 100%)',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 600,
    letterSpacing: 0.2,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 12px rgba(0,0,0,0.25)',
};

const chipStyle: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 999,
    border: "none",
    color: "white",
    fontSize: 13,
};

const thStyle: React.CSSProperties = {
    textAlign: "left",
    padding: "6px 8px",
    borderBottom: "1px solid #20264a",
    position: "sticky",
    top: 0,
};

const tdStyle: React.CSSProperties = {
    padding: "6px 8px",
    borderBottom: "1px dashed #20264a",
};

const tdLabelStyle: React.CSSProperties = {
    ...tdStyle,
    fontWeight: 600,
    width: 140,
};
