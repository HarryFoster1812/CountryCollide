"use client";
import CountryCollisionLoader from "./CountryCollisionLoader";
import { useSearchParams } from "next/navigation";

export default function PageWithCollisionLoader() {
  const params = useSearchParams();

  const country1 = params.get("a") ?? "Canada";
  const country2 = params.get("b") ?? "United States";

  // If you want to gate behind some actual async work, keep this.
  // For now, we’ll just always show the loader demo:
  const isLoading = true;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Subtle radial glow behind content */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(56,189,248,0.15),rgba(2,6,23,0))]" />

      <div className="mx-auto flex max-w-5xl items-center justify-center px-4 py-16 md:py-24">
        {isLoading ? (
          <CountryCollisionLoader countryA={country1} countryB={country2} />
        ) : (
          <div className="text-xl">Content Loaded!</div>
        )}
      </div>
    </div>
  );
}
