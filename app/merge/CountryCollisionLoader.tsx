"use client";

import { useEffect, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import Loader from "@/components/Loader";
// Head not needed for this embedded widget; re-add if used as a page
// import Head from "next/head";

// -----------------------------
// Helpers
// -----------------------------
async function fetchSvgPath(url: string): Promise<string | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const text = await res.text();
  try {
    const doc = new DOMParser().parseFromString(text, "image/svg+xml");
    const el = doc.querySelector("path");
    if (el && el.getAttribute("d")) return el.getAttribute("d");
    const paths = Array.from(doc.querySelectorAll("path"));
    if (paths.length) return paths.map((p) => `M0,0 ${p.getAttribute("d") || ""}`).join(" ");
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
  width?: number;
  height?: number;
}

// -----------------------------
// Component
// -----------------------------
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
        fetchSvgPath(
          `/api/merge_countries?a=${encodeURIComponent(
            sanitizeName(countryA)
          )}&b=${encodeURIComponent(sanitizeName(countryB))}`
        ),
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

  async function play() {
    // 1) Reset
    await mergedControls.set({ opacity: 0, scale: 0.95 });
    await Promise.all([
      aControls.set({ x: -width * 0.35, opacity: 1, rotate: 0, scale: 1 }),
      bControls.set({ x: width * 0.35, opacity: 1, rotate: 0, scale: 1 }),
    ]);

    // 2) Approach
    await Promise.all([
      aControls.start({ x: -width * 0.12, transition: { type: "spring", stiffness: 140, damping: 18 } }),
      bControls.start({ x: width * 0.12, transition: { type: "spring", stiffness: 140, damping: 18 } }),
    ]);

    // 3) Impact wobble
    await Promise.all([
      aControls.start({ x: -10, rotate: -2, scale: 1.03, transition: { duration: 0.25 } }),
      bControls.start({ x: 10, rotate: 2, scale: 1.03, transition: { duration: 0.25 } }),
    ]);
    await Promise.all([
      aControls.start({ x: -4, rotate: 0, scale: 1.0, transition: { duration: 0.25 } }),
      bControls.start({ x: 4, rotate: 0, scale: 1.0, transition: { duration: 0.25 } }),
    ]);

    // 4) Fade to merged
    await Promise.all([
      aControls.start({ opacity: 0, transition: { duration: 0.35 } }),
      bControls.start({ opacity: 0, transition: { duration: 0.35 } }),
    ]);
    await mergedControls.start({ opacity: 1, scale: 1, transition: { duration: 0.5 } });

    // 5) Loop
    await new Promise((r) => setTimeout(r, 1200));
    void play();
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryA, countryB]);

  useEffect(() => {
    if (!loading && pathA && pathB) {
      void play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, pathA, pathB, pathMerged]);

  const showSVG = pathA || pathB || pathMerged;

  return (
    <div className="w-full">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {loading ? `Loading ${countryA} & ${countryB}...` : <Loader/>}
          </h1>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-white/10 bg-rose-500/10 px-4 py-3 text-sm text-rose-200/90">
            {error}
          </div>
        )}

        {/* Card shell with the app’s glassy look */}
        <div className="relative rounded-3xl border border-white/10 bg-white/5 p-4 shadow-sm md:p-6">
          {/* soft sky glow */}
          <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-gradient-to-b from-sky-500/20 via-sky-500/10 to-transparent blur-2xl" />

          {showSVG ? (
            <svg
              width={width}
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              className="h-auto w-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Country A */}
              {pathA && (
                <motion.path
                  d={pathA}
                  fill="none"
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth={1.6}
                  initial={{ x: -width * 0.35, opacity: 1 }}
                  animate={aControls}
                />
              )}

              {/* Country B */}
              {pathB && (
                <motion.path
                  d={pathB}
                  fill="none"
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth={1.6}
                  initial={{ x: width * 0.35, opacity: 1 }}
                  animate={bControls}
                />
              )}

              {/* Merged outline */}
              {pathMerged && (
                <motion.path
                  d={pathMerged}
                  fill="rgba(255,255,255,0.06)"   // subtle fill on dark background
                  stroke="rgba(255,255,255,0.95)"
                  strokeWidth={2}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={mergedControls}
                  style={{ transformOrigin: `${width / 2}px ${height / 2}px` }}
                />
              )}
            </svg>
          ) : (
            <div
              style={{ width, height }}
              className="grid place-items-center text-sm text-white/60"
            >
              {loading ? "Fetching country data..." : "No SVG data available."}
            </div>
          )}
        </div>

        {/* tiny footnote */}
        <div className="mt-3 text-center text-xs text-white/50">
          Tip: deep link here with <code className="rounded bg-white/10 px-1.5 py-0.5">?a=France&b=Germany</code>
        </div>
      </div>
    </div>
  );
}
