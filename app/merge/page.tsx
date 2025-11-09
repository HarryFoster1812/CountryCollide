'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FictionalCountry, MergeInput } from '@/lib/types';
import ResultDisplay from '@/components/ResultDisplay';
import ErrorDisplay from '@/components/ErrorDisplay';
import CountryCollisionLoader from "./CountryCollisionLoader";


async function fetchSvgPath(url: string): Promise<string | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const text = await res.text();
  try {
    const doc = new DOMParser().parseFromString(text, "image/svg+xml");
    const el = doc.querySelector("path");
    if (el && el.getAttribute("d")) return el.getAttribute("d");
    const paths = Array.from(doc.querySelectorAll("path"));
    // Reverting to the simpler join for safety, consider if M0,0 is truly needed per path
    // if (paths.length) return paths.map((p) => `M0,0 ${p.getAttribute("d") || ""}`).join(" ");
    if (paths.length) return paths.map((p) => p.getAttribute("d") || "").join(" ");
  } catch (_) {}
  return null;
}

function sanitizeName(s: string) {
  return s.trim();
}


const MergePage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FictionalCountry | null>(null);
  const [generationAttempted, setGenerationAttempted] = useState<boolean>(false); // To track if we've tried to generate

  const [pathMerged, setPathMerged] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const countryA = searchParams.get("a");
  const countryB = searchParams.get("b");

  // Define width and height using useState if they might change,
  // or as constants if fixed. For this scenario, fixed constants are fine.
  const svgWidth = 800;
  const svgHeight = 520;


  const handleGenerate = useCallback(async (input: MergeInput) => {
    setIsLoading(true);
    setPathMerged(null); // Clear previous merged path
    setError(null);
    setResult(null);

    // Ensure countryA and countryB are defined before using them
    if (!countryA || !countryB) {
        setError("Missing country parameters for merged SVG.");
        setIsLoading(false);
        return;
    }

    // Fetch the merged SVG path concurrently with the agent API call
    const mergedPathPromise = fetchSvgPath(
        `/api/merge_countries?a=${encodeURIComponent(sanitizeName(countryA))}&b=${encodeURIComponent(sanitizeName(countryB))}`
    );


    try {
      const response = await fetch('/api/merge_agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'An unknown error occurred.');
      }

      setResult(data.data);
      // After successfully getting the result, await the merged path promise
      const pm = await mergedPathPromise;
      setPathMerged(pm);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setPathMerged(null); // Clear path on error
    } finally {
      setIsLoading(false);
    }
  }, [countryA, countryB]); // Add countryA, countryB to useCallback dependencies

  // Effect to trigger generation on initial load or when search params change
  useEffect(() => {
    // Only attempt generation if we haven't already and both params are present
    if (countryA && countryB && !generationAttempted) {
      setGenerationAttempted(true); // Mark that we've tried to generate
      handleGenerate({
        country_a: countryA,
        country_b: countryB,
        options: {
          years_forward: 10, // Default value if not provided by URL or UI
          name_style: 'portmanteau', // Default value if not provided by URL or UI
        },
      });
    } else if ((!countryA || !countryB) && !generationAttempted) {
        // If params are missing, and we haven't generated yet, show an error
        setGenerationAttempted(true);
        setError("Please provide both 'a' and 'b' country parameters in the URL (e.g., /merge?a=Japan&b=Brazil).");
    }
  }, [countryA, countryB, handleGenerate, generationAttempted]);


  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-extrabold text-center text-cyan-400 mb-10 drop-shadow-lg">
          Country Fusion Result
        </h1>

        {/* Show loader only if loading and both countries are defined */}
        {isLoading && countryA && countryB && <CountryCollisionLoader countryA={countryA} countryB={countryB} />}

        {error && <ErrorDisplay message={error} />}

        {result && !isLoading && (
        <div className="mt-12 max-w-6xl mx-auto"> {/* Adjusted structure to wrap everything inside the result condition */}
            <div className="relative rounded-3xl border border-white/10 bg-white/5 p-4 shadow-sm md:p-6 mb-8"> {/* Added mb-8 for spacing */}
              {/* soft sky glow */}
              <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-gradient-to-b from-sky-500/20 via-sky-500/10 to-transparent blur-2xl" />

              {pathMerged ? ( // Use pathMerged directly for conditional rendering
                <svg
                  width={svgWidth} // Use constants for width and height
                  height={svgHeight}
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="h-auto w-full max-w-xl mx-auto" // Center and make responsive
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Merged outline */}
                  <path
                    d={pathMerged}
                    fill="rgba(255,255,255,0.06)"   // subtle fill on dark background
                    stroke="rgba(255,255,255,0.95)"
                    strokeWidth={2}
                    // 'initial' is a Framer Motion prop; it's not valid on a regular <path>
                    // Remove it here, as this path is static once rendered.
                    // style={{ transformOrigin: `${svgWidth / 2}px ${svgHeight / 2}px` }} // style also removed as it's not motion path
                    key={`path-merged-${countryA}-${countryB}`}
                  />
                </svg>
              ) : (
                <div className="grid place-items-center text-sm text-white/60" style={{ height: svgHeight }}>
                  Loading merged SVG...
                </div>
              )}
            </div>
            {/* ResultDisplay moved outside the SVG container but still within the result && !isLoading block */}
            <div>
                <ResultDisplay data={result} />
            </div>
        </div>
        )} {/* Closing tag for result && !isLoading */}

        {!isLoading && !error && !result && generationAttempted && (
            <p className="text-center text-gray-400">
                Awaiting country parameters in the URL to generate a fusion.
            </p>
        )}
      </main>
    </div>
  );
};

export default MergePage;
