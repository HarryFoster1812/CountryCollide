"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as topojson from "topojson-client";
import * as d3geo from "d3-geo";
import GlobeCanvas, { Feature, GlobeHandle } from "@/components/GlobeCanvas";

type Props = {
  height?: number;
  backgroundColor?: string;
  geojsonUrl?: string;
};

export default function HeroGlobe({
  height = 520, // matches your md:h-[520px]
  backgroundColor = "#0b1020",
  geojsonUrl = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson",
}: Props) {
  const globeRef = useRef<GlobeHandle | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  // Load features (GeoJSON or TopoJSON)
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

  return (
    <div className="relative w-full">
      {/* same glow/frames as your placeholder */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-sky-500/20 via-sky-500/10 to-transparent blur-2xl" />
      <div className="absolute inset-0 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
      <div className="relative">
        <div className="h-[380px] w-full md:h-[520px] overflow-hidden rounded-3xl">
          <GlobeCanvas
            ref={globeRef}
            height={height}
            backgroundColor={backgroundColor}
            features={features}
            selectedKeys={selected}
            getCountryKey={getCountryKey}
            getFeatureCentroid={getFeatureCentroid}
            onToggleCountry={(poly) => toggleSelection(poly)}
          />
        </div>
      </div>
    </div>
  );
}
