"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { useSearchParams } from 'next/navigation'
import Head from "next/head";

/**
 * Country Collision Demo
 * - Fetches single-country SVGs from /api/country_svg?a=
 * - Fetches merged SVG from /api/merge_country?a=&b=
 * - Animates two outlines colliding into the center, then crossfades to the merged outline
 *
 * Usage: drop in app/collision/page.tsx (or pages/collision.tsx) and run.
 * Dependencies: `npm i framer-motion`
 */

// -----------------------------
// Helpers
// -----------------------------
async function fetchSvgPath(url: string): Promise<string | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const text = await res.text();
  // Parse and pull the first <path d="...">
  try {
    const doc = new DOMParser().parseFromString(text, "image/svg+xml");
    const el = doc.querySelector("path");
    if (el && el.getAttribute("d")) return el.getAttribute("d");
    // fallback: if outer SVG uses multiple paths, merge them by concatenation
    const paths = Array.from(doc.querySelectorAll("path"));
    if (paths.length) return paths.map(p => `M0,0 ${p.getAttribute("d") || ""}`).join(" ");
  } catch (_) {}
  return null;
}

function sanitizeName(s: string) {
  return s.trim();
}

// -----------------------------
// Component
// -----------------------------
export default function CountryCollisionPage() {
      const params = useSearchParams();
  const initialA = (params.get("a") ?? "France");
  const initialB = (params.get("b") ?? "Germany");
  const [a, setA] = useState(initialA);
  const [b, setB] = useState(initialB);
  const [pathA, setPathA] = useState<string | null>(null);
  const [pathB, setPathB] = useState<string | null>(null);
  const [pathMerged, setPathMerged] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const width = 800;
  const height = 520;

  const aControls = useAnimationControls();
  const bControls = useAnimationControls();
  const mergedControls = useAnimationControls();

  async function loadAll() {
    setError("");
    setLoading(true);
    try {
      const [pa, pb, pm] = await Promise.all([
        fetchSvgPath(`/api/country_svg?a=${encodeURIComponent(sanitizeName(a))}`),
        fetchSvgPath(`/api/country_svg?a=${encodeURIComponent(sanitizeName(b))}`),
        fetchSvgPath(`/api/merge_countries?a=${encodeURIComponent(sanitizeName(a))}&b=${encodeURIComponent(sanitizeName(b))}`),
      ]);
      setPathA(pa);
      setPathB(pb);
      setPathMerged(pm);
    } catch (e: any) {
      setError(e?.message || "Failed to load SVGs");
    } finally {
      setLoading(false);
    }
  }

// 1) Run loads whenever the countries change (and not on every render)
useEffect(() => {
  loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [a, b]);

// 2) Auto-play right after paths are ready (i.e., loading finished)
useEffect(() => {
  if (!loading && pathA && pathB) {
    void play();
  }
}, [loading, pathA, pathB, pathMerged]); // include merged so we can fade to it when it's ready


async function play() {
  // reset visibility
  await mergedControls.set({ opacity: 0, scale: 0.95 });
  await Promise.all([
    aControls.set({ x: -width * 0.35, opacity: 1, rotate: 0, scale: 1 }),
    bControls.set({ x: width * 0.35, opacity: 1, rotate: 0, scale: 1 }),
  ]);

  // approach
  await Promise.all([
    aControls.start({ x: -width * 0.12, transition: { type: "spring", stiffness: 140, damping: 18 } }),
    bControls.start({ x: width * 0.12, transition: { type: "spring", stiffness: 140, damping: 18 } }),
  ]);

  // impact wobble
  await Promise.all([
    aControls.start({ x: -10, rotate: -2, scale: 1.03, transition: { duration: 0.25 } }),
    bControls.start({ x: 10, rotate: 2, scale: 1.03, transition: { duration: 0.25 } }),
  ]);
  await Promise.all([
    aControls.start({ x: -4, rotate: 0, scale: 1.0, transition: { duration: 0.25 } }),
    bControls.start({ x: 4, rotate: 0, scale: 1.0, transition: { duration: 0.25 } }),
  ]);

  // fade out individuals, fade in merged
  await Promise.all([
    aControls.start({ opacity: 0, transition: { duration: 0.35 } }),
    bControls.start({ opacity: 0, transition: { duration: 0.35 } }),
  ]);
  await mergedControls.start({ opacity: 1, scale: 1, transition: { duration: 0.5 } });

  await new Promise((r) => setTimeout(r, 1200));
  void play(); // recursively call to loop forever
}

  const disabled = loading || !pathA || !pathB;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Head>
        <title>Country Collision</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>


        {error && (
          <div className="mt-3 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="mt-6 bg-white rounded-2xl shadow p-4">
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto border border-gray-200 rounded-lg bg-white"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* guides */}
            <g opacity={0.06}>
              <rect x={0} y={0} width={width} height={height} fill="#000" />
              <line x1={width/2} y1={0} x2={width/2} y2={height} stroke="#000" strokeWidth={1} />
            </g>

            {/* Country A */}
            {pathA && (
              <motion.path
                d={pathA}
                fill="none"
                stroke="#111"
                strokeWidth={1.5}
                initial={{ x: -width * 0.35, opacity: 1 }}
                animate={aControls}
              />
            )}

            {/* Country B */}
            {pathB && (
              <motion.path
                d={pathB}
                fill="none"
                stroke="#111"
                strokeWidth={1.5}
                initial={{ x: width * 0.35, opacity: 1 }}
                animate={bControls}
              />
            )}

            {/* Merged outline */}
{pathMerged && (
  <motion.path
    d={pathMerged}
    fill="white"
    stroke="#111"
    strokeWidth={2}
    initial={{ opacity: 0, scale: 0.95 }}
    animate={mergedControls}
    style={{ transformOrigin: `${width / 2}px ${height / 2}px` }}
  />
)}
          </svg>

          <div className="mt-2 text-xs text-gray-500">
            Tip: if a country looks tiny compared to the other, ensure your API scales both to equal area before returning SVGs.
          </div>
        </div>
    </div>
  );
}
