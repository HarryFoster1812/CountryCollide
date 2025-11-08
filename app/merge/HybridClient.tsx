'use client';

import React, { useMemo, useState, useEffect } from "react";
import * as d3 from "d3";

type GeoJSONFeature = GeoJSON.Feature<GeoJSON.Geometry, any>;
type GeoJSONFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry>;

const WIDTH = 900;
const HEIGHT = 520;
const HYBRID_SIZE = 360;
const RESAMPLE_N = 256;

function ringsFromGeom(geom?: GeoJSON.Geometry | null): number[][][] {
  if (!geom) return [];
  if (geom.type === "Polygon") return (geom.coordinates as number[][][]);
  if (geom.type === "MultiPolygon") return (geom.coordinates as number[][][][]).flat();
  return [];
}

function largestRing(rings: number[][][]) {
  if (!rings.length) return null;
  let best = rings[0];
  let bestLen = -Infinity;
  for (const r of rings) {
    let L = 0;
    for (let i = 0; i < r.length - 1; i++) {
      const dx = r[i+1][0] - r[i][0];
      const dy = r[i+1][1] - r[i][1];
      L += Math.hypot(dx, dy);
    }
    if (L > bestLen) { bestLen = L; best = r; }
  }
  return best;
}

const projection = d3.geoNaturalEarth1()
  .fitExtent([[8,8], [WIDTH-8, HEIGHT-8]], { type: "Sphere" } as any);

function resampleClosed(points: [number, number][], N: number) {
  if (!points || points.length < 3) return [];
  if (points[0][0] !== points.at(-1)![0] || points[0][1] !== points.at(-1)![1]) {
    points = [...points, points[0]];
  }
  const segLens:number[] = [];
  let total = 0;
  for (let i=0;i<points.length-1;i++) {
    const dx = points[i+1][0]-points[i][0];
    const dy = points[i+1][1]-points[i][1];
    const L = Math.hypot(dx,dy);
    segLens.push(L); total += L;
  }
  const targets = d3.range(N).map(k => (k/N) * total);
  const res:[number,number][] = [];
  let acc = 0, j = 0;
  for (const t of targets) {
    while (j < segLens.length-1 && acc + segLens[j] < t) { acc += segLens[j]; j++; }
    const remain = t - acc;
    const L = segLens[j] || 1e-9;
    const u = Math.max(0, Math.min(1, remain / L));
    const A = points[j], B = points[j+1];
    res.push([A[0]*(1-u)+B[0]*u, A[1]*(1-u)+B[1]*u]);
  }
  return res;
}

function normalizeForMatch(pts:[number,number][]) {
  const cx = d3.mean(pts, p=>p[0]) || 0;
  const cy = d3.mean(pts, p=>p[1]) || 0;
  const centered = pts.map(([x,y]) => [x-cx, y-cy] as [number,number]);
  const rms = Math.sqrt(d3.mean(centered, p=>p[0]*p[0]+p[1]*p[1]) || 1e-6);
  const scaled = centered.map(([x,y]) => [x/rms, y/rms] as [number,number]);
  return { pts: scaled, cx, cy, scale: rms };
}
function optimalRotationAngle(A:[number,number][], B:[number,number][]) {
  let s = 0, c = 0;
  for (let i=0;i<A.length;i++) {
    const [ax,ay] = A[i]; const [bx,by] = B[i];
    s += ax*by - ay*bx;
    c += ax*bx + ay*by;
  }
  return Math.atan2(s, c);
}
function rotate(points:[number,number][], theta:number) {
  const ct = Math.cos(theta), st = Math.sin(theta);
  return points.map(([x,y]) => [x*ct - y*st, x*st + y*ct] as [number,number]);
}
function averagePoints(A:[number,number][], B:[number,number][]) {
  const n = Math.min(A.length, B.length);
  const out = new Array<[number,number]>(n);
  for (let i=0;i<n;i++) out[i] = [(A[i][0]+B[i][0])/2, (A[i][1]+B[i][1])/2];
  return out;
}
function toPath(points:[number,number][]) {
  const line = d3.line<[number,number]>()
    .x(d=>d[0])
    .y(d=>d[1])
    .curve(d3.curveCardinalClosed.tension(0.5));
  return line(points) || "";
}

export default function HybridClient({ countries }: { countries: GeoJSONFeatureCollection }) {
  const [selA, setSelA] = useState<string | null>(null);
  const [selB, setSelB] = useState<string | null>(null);
  const [hybridPath, setHybridPath] = useState("");

  const projectionPath = useMemo(() => d3.geoPath(projection as any), []);
  const nameList = useMemo(() =>
    countries.features
      .map(f => (f.properties?.name ?? (f.properties?.NAME ?? f.id)) as string)
      .filter(Boolean)
      .sort((a,b)=>a.localeCompare(b))
  , [countries]);

  const byName = useMemo(() => {
    const m = new Map<string, GeoJSONFeature>();
    for (const f of countries.features) {
      const name = (f.properties?.name ?? (f.properties?.NAME ?? f.id)) as string;
      if (name) m.set(name, f);
    }
    return m;
  }, [countries]);

  useEffect(() => {
    if (!selA || !selB) { setHybridPath(""); return; }
    const fA = byName.get(selA);
    const fB = byName.get(selB);
    if (!fA || !fB) { setHybridPath(""); return; }

    const ringA = largestRing(ringsFromGeom(fA.geometry));
    const ringB = largestRing(ringsFromGeom(fB.geometry));
    if (!ringA || !ringB) { setHybridPath(""); return; }

    const Axy = ringA.map(([lon,lat]) => projection([lon,lat]) as [number,number]);
    const Bxy = ringB.map(([lon,lat]) => projection([lon,lat]) as [number,number]);

    const Ares = resampleClosed(Axy, RESAMPLE_N);
    const Bres = resampleClosed(Bxy, RESAMPLE_N);

    const NA = normalizeForMatch(Ares);
    const NB = normalizeForMatch(Bres);
    const theta = optimalRotationAngle(NA.pts, NB.pts);
    const Brot = rotate(NB.pts, theta);

    const avg = averagePoints(NA.pts, Brot);
    const xs = avg.map(p=>p[0]), ys = avg.map(p=>p[1]);
    const minx = Math.min(...xs), maxx = Math.max(...xs);
    const miny = Math.min(...ys), maxy = Math.max(...ys);
    const w = maxx-minx, h = maxy-miny;
    const s = (HYBRID_SIZE*0.85)/Math.max(w,h||1);
    const cx = (minx+maxx)/2, cy = (miny+maxy)/2;
    const scaled = avg.map(([x,y]) => [(x-cx)*s, (y-cy)*s] as [number,number]);

    setHybridPath(toPath(scaled));
  }, [selA, selB, byName]);

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Hybrid Country Builder</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 rounded-2xl border overflow-hidden">
          <svg width={WIDTH} height={HEIGHT} className="bg-white">
            <rect width={WIDTH} height={HEIGHT} rx={16} className="fill-white" />
            <g>
              {countries.features.map((f, i) => {
                const n = (f.properties?.name ?? (f.properties?.NAME ?? f.id)) as string;
                const isA = selA === n;
                const isB = selB === n;
                return (
                  <path
                    key={i}
                    d={projectionPath(f as any) || ""}
                    onClick={() => {
                      if (!selA) setSelA(n);
                      else if (!selB) setSelB(n);
                      else { setSelA(n); setSelB(null); }
                    }}
                    className="cursor-pointer transition-all"
                    style={{
                      fill: isA ? "#111827" : isB ? "#2563eb" : "#e6e6e6",
                      stroke: "#999",
                      strokeWidth: 0.5
                    }}
                  />
                );
              })}
            </g>
          </svg>
        </div>

        <div className="space-y-4">
          <div className="border rounded-2xl p-4 space-y-4">
            <CountryPicker label="Country A" value={selA} onChange={setSelA} options={nameList} />
            <CountryPicker label="Country B" value={selB} onChange={setSelB} options={nameList} />
            <div className="flex gap-2">
              <button className="px-3 py-2 rounded-xl border"
                onClick={() => { setSelA(null); setSelB(null); setHybridPath(""); }}>
                Clear
              </button>
              <button
                className="px-3 py-2 rounded-xl border bg-black text-white disabled:opacity-50"
                onClick={() => { if (selA && selB) navigator.clipboard.writeText(hybridPath || ""); }}
                disabled={!selA || !selB}
              >
                Copy SVG Path
              </button>
            </div>
          </div>

          <div className="border rounded-2xl p-4">
            <div className="text-sm font-medium text-gray-500 mb-2">New Country</div>
            <div className="w-full h-[420px] flex items-center justify-center bg-gray-50 rounded-2xl">
              <svg width={HYBRID_SIZE} height={HYBRID_SIZE}
                   viewBox={`${-HYBRID_SIZE/2} ${-HYBRID_SIZE/2} ${HYBRID_SIZE} ${HYBRID_SIZE}`}>
                <rect x={-HYBRID_SIZE/2} y={-HYBRID_SIZE/2} width={HYBRID_SIZE} height={HYBRID_SIZE}
                      rx={16} className="fill-white"/>
                {hybridPath
                  ? <path d={hybridPath} fill="#111827" />
                  : <text x="0" y="0" textAnchor="middle" dominantBaseline="middle" className="fill-gray-400">
                      Select two countries
                    </text>}
              </svg>
            </div>
            {selA && selB && (
              <div className="text-xs text-gray-500 mt-2">
                Hybrid of <span className="font-medium">{selA}</span> and <span className="font-medium">{selB}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CountryPicker({
  label, value, onChange, options
}: {
  label: string;
  value: string | null;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return options.slice(0, 200);
    return options.filter(o => o.toLowerCase().includes(qq)).slice(0, 200);
  }, [q, options]);

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <input className="w-full border rounded-xl px-3 py-2"
             placeholder="Search country..." value={q} onChange={e=>setQ(e.target.value)} />
      <div className="max-h-48 overflow-auto border rounded-xl p-2">
        <div className="grid grid-cols-2 gap-2">
          {filtered.map((name) => (
            <button key={name} onClick={() => onChange(name)}
                    className={`text-left p-2 rounded-xl border hover:shadow ${value===name?"bg-gray-100":"bg-white"}`}>
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
