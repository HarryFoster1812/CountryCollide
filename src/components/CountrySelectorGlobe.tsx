"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as topojson from "topojson-client";
import * as d3geo from "d3-geo";
import Link from "next/link";
import GlobeCanvas, { Feature, GlobeHandle } from "./GlobeCanvas";
import { getCountryData } from "../../app/api/country_api.js";

export default function CountrySelectorGlobe({
  height = 600,
  globeBackgroundColor = "#0b1020",
  geojsonUrl = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson",
}: {
  height?: number;
  globeBackgroundColor?: string;
  geojsonUrl?: string;
}) {
  const globeRef = useRef<GlobeHandle | null>(null);

  const [features, setFeatures] = useState<Feature[]>([]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [search, setSearch] = useState("");
  const [matchesOpen, setMatchesOpen] = useState(false);

  const [countryData, setCountryData] = useState<any>({});

  // --- Load country polygons (handles GeoJSON or TopoJSON) ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(geojsonUrl);
      const data = await res.json();

      let geojson: any;
      if (data.type === "Topology") {
        const obj =
          data.objects?.countries || data.objects?.land || Object.values(data.objects || {})[0];
        geojson = topojson.feature(data, obj as any);
      } else {
        geojson = data;
      }

      const feats = (geojson.features || []).map((f: any) => ({
        ...f,
        properties: {
          name:
            f.properties?.name_long ||
            f.properties?.ADMIN ||
            f.properties?.name ||
            f.properties?.NAME ||
            f.id ||
            "Unknown",
          // keep other props
          ...f.properties,
        },
      }));

      if (!cancelled) setFeatures(feats);
    })();
    return () => {
      cancelled = true;
    };
  }, [geojsonUrl]);

  // --- utils ---
  const getCountryKey = (f: Feature) => (f?.properties?.name || "").toLowerCase().trim();

  const toggleSelection = (featureOrName: Feature | string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const key =
        typeof featureOrName === "string"
          ? featureOrName.toLowerCase().trim()
          : getCountryKey(featureOrName);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

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
    const map = new Map(allNames.map((n) => [n.toLowerCase(), n]));
    return Array.from(selected)
      .map((k) => map.get(k))
      .filter(Boolean)
      .sort((a, b) => a!.localeCompare(b!)) as string[];
  }, [selected, allNames]);

  const jumpToCountry = (name: string, { toggle = true } = {}) => {
    const key = name.toLowerCase().trim();
    const feat = features.find((f) => getCountryKey(f) === key);
    if (!feat) return;
    if (toggle) toggleSelection(feat);
    const [lng, lat] = getFeatureCentroid(feat);
    globeRef.current?.pointOfView({ lat, lng, altitude: 1.5 }, 800);
  };

  useEffect(() => {
    getCountryData(selectedNames).then(setCountryData);
  }, [selectedNames]);

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

  // --- UI ---
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 12 }}>
      {/* Globe extracted into its own component */}
      <GlobeCanvas
        ref={globeRef}
        height={height}
        backgroundColor={globeBackgroundColor}
        features={features}
        selectedKeys={selected}
        getCountryKey={getCountryKey}
        getFeatureCentroid={getFeatureCentroid}
        onToggleCountry={(poly) => toggleSelection(poly)}
      />

      {/* Side panel (unchanged UI) */}
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
          <label
            htmlFor="country-search"
            style={{ fontSize: 12, opacity: 0.8, display: "block", marginBottom: 6 }}
          >
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
                const isSelected = selected.has(name.toLowerCase());
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

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setSelected(new Set())} style={btnStyle} title="Clear all">
            Clear all
          </button>

          {selectedNames.length >= 2 && (
            <button style={{ ...btnStyle, background: "#1b2352" }} title="Compare selected">
              {`Compare (${selectedNames.length})`}
            </button>
          )}

          {selectedNames.length === 2 && (
            <Link href={`/merge?a=${selectedNames[0]}&b=${selectedNames[1]}`}>
              <button
                style={{ ...btnStyle, background: "#131938" }}
                title="Merge the two selected countries"
              >
                {"Merge (2)"}
              </button>
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
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 4px",
                    borderBottom: "1px dashed #20264a",
                  }}
                >
                  <div
                    style={{
                      ...chipStyle,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      padding: "10px",
                      background: "#17204a",
                      borderRadius: "8px",
                      color: "#fff",
                      width: "100%",
                    }}
                  >
                    {/* Title */}
                    <div style={{ fontWeight: "bold", marginBottom: "5px" }}>{name}</div>

                    {/* Fly-to button */}
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
                        marginBottom: "5px",
                        padding: "5px 10px",
                        background: "#0b1a3b",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        color: "#fff",
                      }}
                    >
                      Go to
                    </button>

                    {/* Stats */}
                    <div style={{ fontSize: "14px", marginBottom: "5px" }}>
                      <div>Population: 123</div>
                      <div>Land Area: {countryData[name]?.landArea ?? "N/A"} km²</div>
                      <div>GDP: {countryData[name]?.gdpPerCapita ?? "N/A"}</div>
                    </div>

                    {/* Flag(s) */}
                    {(
                      <img
                        src={countryData[name]?.flagUrl ?? "N/A"}
                        alt={`${name} flag`}
                        style={{ width: "50px", height: "30px", objectFit: "cover", borderRadius: "3px" }}
                      />
                    )}
                    {(() => {
                      const code = codeFor(name);
                      return code ? (
                        <img
                          src={`https://flagsapi.com/${code}/flat/64.png`}
                          alt={`${name} flag`}
                          style={{ width: "50px", height: "30px", objectFit: "cover", borderRadius: "3px" }}
                        />
                      ) : null;
                    })()}
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
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #2b3157",
  background: "#131938",
  color: "white",
  cursor: "pointer",
};

const chipStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "none",
  color: "white",
  fontSize: 13,
};
