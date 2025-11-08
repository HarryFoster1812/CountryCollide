"use client";

import { useEffect, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import Head from "next/head";

// -----------------------------
// Helpers
// -----------------------------

/**
 * Parses SVG text to extract the 'd' attribute(s) from <path> elements.
 * @param url The API endpoint to fetch the SVG from.
 * @returns A promise resolving to the concatenated path string or null.
 */
async function fetchSvgPath(url: string): Promise<string | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const text = await res.text();
  // Parse and pull the <path d="...">
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
// Component Props
// -----------------------------

interface CountryCollisionLoaderProps {
  countryA: string;
  countryB: string;
  // Optional: Allows control over the SVG size if needed
  width?: number;
  height?: number;
}

// -----------------------------
// Component
// -----------------------------

/**
 * Animates two country outlines colliding and merging into a single outline.
 *
 * @param countryA The name of the first country (e.g., "France").
 * @param countryB The name of the second country (e.g., "Germany").
 * @param width The width of the SVG viewport (default: 800).
 * @param height The height of the SVG viewport (default: 520).
 */
export default function CountryCollisionLoader({
  countryA,
  countryB,
  width = 800,
  height = 520,
}: CountryCollisionLoaderProps) {
  const [pathA, setPathA] = useState<string | null>(null);
  const [pathB, setPathB] = useState<string | null>(null);
  const [pathMerged, setPathMerged] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Framer Motion controls
  const aControls = useAnimationControls();
  const bControls = useAnimationControls();
  const mergedControls = useAnimationControls();

  /**
   * Fetches all required country paths from the API.
   */
  async function loadAll() {
    setError("");
    setLoading(true);
    setPathA(null);
    setPathB(null);
    setPathMerged(null);

    try {
      const [pa, pb, pm] = await Promise.all([
        fetchSvgPath(`/api/country_svg?a=${encodeURIComponent(sanitizeName(countryA))}`),
        fetchSvgPath(`/api/country_svg?a=${encodeURIComponent(sanitizeName(countryB))}`),
        fetchSvgPath(`/api/merge_countries?a=${encodeURIComponent(sanitizeName(countryA))}&b=${encodeURIComponent(sanitizeName(countryB))}`),
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

  /**
   * Runs the collision animation sequence.
   */
  async function play() {
    // 1. Reset
    await mergedControls.set({ opacity: 0, scale: 0.95 });
    await Promise.all([
      aControls.set({ x: -width * 0.35, opacity: 1, rotate: 0, scale: 1 }),
      bControls.set({ x: width * 0.35, opacity: 1, rotate: 0, scale: 1 }),
    ]);

    // 2. Approach
    await Promise.all([
      aControls.start({ x: -width * 0.12, transition: { type: "spring", stiffness: 140, damping: 18 } }),
      bControls.start({ x: width * 0.12, transition: { type: "spring", stiffness: 140, damping: 18 } }),
    ]);

    // 3. Impact wobble
    await Promise.all([
      aControls.start({ x: -10, rotate: -2, scale: 1.03, transition: { duration: 0.25 } }),
      bControls.start({ x: 10, rotate: 2, scale: 1.03, transition: { duration: 0.25 } }),
    ]);
    await Promise.all([
      aControls.start({ x: -4, rotate: 0, scale: 1.0, transition: { duration: 0.25 } }),
      bControls.start({ x: 4, rotate: 0, scale: 1.0, transition: { duration: 0.25 } }),
    ]);

    // 4. Fade to merged
    await Promise.all([
      aControls.start({ opacity: 0, transition: { duration: 0.35 } }),
      bControls.start({ opacity: 0, transition: { duration: 0.35 } }),
    ]);
    await mergedControls.start({ opacity: 1, scale: 1, transition: { duration: 0.5 } });

    // 5. Loop preparation
    await new Promise((r) => setTimeout(r, 1200));
    void play(); // recursively call to loop forever
  }

  // Effect 1: Run loads whenever the countries change
  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryA, countryB]);

  // Effect 2: Auto-play right after paths are ready
  useEffect(() => {
    if (!loading && pathA && pathB) {
      void play();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, pathA, pathB, pathMerged]);


  const showSVG = pathA || pathB || pathMerged;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Optional Head for titles/SEO if this is a main page, otherwise remove */}
      {/* <Head>
        <title>Loading: {countryA} + {countryB}</title>
      </Head> */}

      <h1 className="text-2xl font-bold mb-4">
        {loading ? `Loading ${countryA} & ${countryB}...` : "Merging Countries"}
      </h1>

      {error && (
        <div className="mt-3 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 w-full max-w-lg">
          {error}
        </div>
      )}

      {/* SVG Container */}
      <div className="bg-white rounded-2xl shadow p-4 border border-gray-200">
        {showSVG ? (
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto max-w-xl bg-white"
            xmlns="http://www.w3.org/2000/svg"
          >
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
                // transformOrigin is crucial for scale animation to center
                style={{ transformOrigin: `${width / 2}px ${height / 2}px` }}
              />
            )}
          </svg>
        ) : (
          <div style={{ width, height }} className="flex items-center justify-center text-gray-500">
            {loading ? "Fetching country data..." : "No SVG data available."}
          </div>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Collision animation for **{countryA}** and **{countryB}**.
      </div>
    </div>
  );
}
