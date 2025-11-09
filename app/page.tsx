"use client";

import { useState, useMemo, Suspense } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import HeroGlobe from "@/components/HeroGlobe";

// simple className join helper
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// Button
function Button({
  className,
  variant = "default",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}) {
  const base =
    "inline-flex items-center justify-center rounded-2xl font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-400/40 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    default: "bg-sky-500 text-slate-950 hover:bg-sky-400",
    secondary: "bg-white/10 text-white hover:bg-white/15",
    ghost: "bg-transparent text-white hover:bg-white/10",
  } as const;
  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-base",
  } as const;
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}

// Card
function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-white/10 bg-white/5 shadow-sm", className)} {...props} />;
}
function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-white/10 p-4", className)} {...props} />;
}
function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-semibold", className)} {...props} />;
}
function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...props} />;
}

// Input
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none transition placeholder:text-white/40 focus:border-white/20",
        className
      )}
      {...rest}
    />
  );
}

// Badge
function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-xs font-medium",
        className
      )}
      {...props}
    />
  );
}

// Tabs (simple React context based)
import React, { createContext, useContext } from "react";

type TabsCtx = { value: string; setValue: (v: string) => void };
const TabsContext = createContext<TabsCtx | null>(null);

function Tabs({ defaultValue, children, className }: { defaultValue: string; children: React.ReactNode; className?: string }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className={className}>
      <TabsContext.Provider value={{ value, setValue }}>{children}</TabsContext.Provider>
    </div>
  );
}
function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid w-full grid-cols-3 rounded-xl bg-white/5 p-1", className)} {...props} />;
}
function TabsTrigger({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const ctx = useContext(TabsContext);
  const active = ctx?.value === value;
  return (
    <button
      onClick={() => ctx?.setValue(value)}
      className={cn(
        "h-10 rounded-lg px-3 text-sm transition",
        active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10",
        className
      )}
    >
      {children}
    </button>
  );
}
function TabsContent({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const ctx = useContext(TabsContext);
  if (ctx?.value !== value) return null;
  return <div className={cn("", className)}>{children}</div>;
}
// --- End custom UI primitives ---
import { Globe2, RefreshCw, Sparkles, Shuffle, ArrowRight, Play } from "lucide-react";

// OPTIONAL: If you already use a globe library (e.g., react-globe.gl or three.js),
// replace <GlobePlaceholder/> with your actual Globe component. The container is sized for hero use.
function GlobePlaceholder() {
  return (
    <div className="relative h-[380px] w-full md:h-[520px]">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-sky-500/20 via-sky-500/10 to-transparent blur-2xl" />
      <div className="absolute inset-0 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col items-center gap-3 text-center"
        >
          <div className="grid place-items-center rounded-full border border-white/10 p-8">
            <Globe2 className="h-16 w-16 animate-pulse" />
          </div>
          <p className="max-w-md text-sm text-white/70">
            3D globe placeholder — plug in your globe component here. The hero layout already
            handles sizing, rounded corners, and subtle glows.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "France",
  "Germany",
  "Japan",
  "Brazil",
  "India",
  "South Africa",
  "Canada",
  "Australia",
];

function CountrySelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wide text-white/60">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 pr-9 text-sm outline-none transition focus:border-white/20"
        >
          {COUNTRIES.map((c) => (
            <option key={c} value={c} className="bg-slate-900">
              {c}
            </option>
          ))}
        </select>
        <Shuffle className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
      </div>
    </div>
  );
}


export default function LandingHero() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-sky-500 to-cyan-400 text-slate-950">
              <Globe2 className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold tracking-tight">CountryCollide</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a className="text-white/70 transition hover:text-white" href="#how-it-works">
              How it works
            </a>
            <a className="text-white/70 transition hover:text-white" href="#demo">
              Demo
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(56,189,248,0.18),rgba(2,6,23,0.0))]" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-balance text-4xl font-bold tracking-tight sm:text-5xl"
            >
              Explore every country on a beautiful 3D globe.
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-white/70"
            >
              Tap a nation to dive into culture, data, and stories. Compare any two places side by side — or
              ask AI to imagine if they fused into one.
            </motion.p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link  href="/globe">
              <Button size="lg" className="gap-2">
                <Globe2 className="h-4 w-4" /> Launch Globe
              </Button>
              </Link>
              <Badge className="ml-1 border border-white/10 bg-white/5 text-xs text-white/80">
                No signup required
              </Badge>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:max-w-lg">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                <div className="font-medium">Instant Country Profiles</div>
                <div className="text-white/70">Culture, economy, travel, and more.</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                <div className="font-medium">Compare Mode</div>
                <div className="text-white/70">Clear A/B stats & insights.</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                <div className="font-medium">AI Merge</div>
                <div className="text-white/70">What-if cultural blends.</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                <div className="font-medium">Shareable Scenes</div>
                <div className="text-white/70">Deep links for any view.</div>
              </div>
            </div>
          </div>

<Suspense>
  <HeroGlobe />
</Suspense>
        </div>
      </section>


      {/* How it works */}
      <section id="how-it-works" className="border-t border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:grid-cols-3">
          {["Pick & Explore", "Compare", "Merge"].map((title, i) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 font-mono text-xs">
                {i + 1}
              </div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-white/70">
                {i === 0 && "Rotate the globe and tap any country to see culture, data, and quick facts."}
                {i === 1 && "Add a second country to compare economics, demographics, and lifestyle."}
                {i === 2 && "Let AI imagine a blended identity — cuisine, holidays, architecture, and more."}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo CTA */}
      <section id="demo" className="mx-auto max-w-7xl px-4 pb-24">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500/10 via-slate-900 to-slate-950 p-8 md:p-12">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight">Ready to spin the world?</h3>
              <p className="mt-1 max-w-xl text-white/70">
                Deploy the globe widget in minutes. Works with Next.js, ships with sensible defaults.
              </p>
            </div>
            <div className="flex gap-3">
            <Link  href="/globe">
              <Button size="lg" className="gap-2">
                <Play className="h-4 w-4" /> Launch Live Demo
              </Button>

            </Link >
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-white/60">
        <div className="mx-auto max-w-7xl px-4">
          © {new Date().getFullYear()} CountryCollide. Built with fartificial intelligence money.
        </div>
      </footer>
    </div>
  );
}
