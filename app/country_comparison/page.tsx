"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from 'next/link';
import {TravelPlan } from '@/libs/types';
import { getCountryData } from "../api/country_api.js";
import { TTSPlayButton } from '@/components/TTSPlayButton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';



interface MonthlyAverage {
    month: number;
    avg_high_temp_C: number | null;
    avg_low_temp_C: number | null;
    avg_precip_mm: number | null;
}


// Mock type definitions for compilation safety
interface CountryStats {
    name: string;
    population?: number;
    gdpPerCapita?: number;
    landArea?: number;
    avgEducationYears?: number;
    homicideRate?: number;
    energyUsePerCapita?: number;
    happiness?: number;
    militaryExpenditure?: number;
    electricityAccess?: number;
    flagUrl?: string;
    topSongs?: { songs: { rank: string }[] };
}



// --- START: New Modal Component and Logic ---

interface TravelFormData {
    destination: string;
    origin_city: string;
    start_date: string;
    end_date: string;
    traveler_count: number;
    budget_style: 'economy' | 'mid-range' | 'luxury';
}

interface WorldComparePageProps {}

interface TravelModalProps {
    initialDestination: string;
    onClose: () => void;
    onSubmit: (data: TravelFormData) => void;
}

const TravelModal: React.FC<TravelModalProps> = ({ initialDestination, onClose, onSubmit }) => {
    const today = new Date().toISOString().split('T')[0];
    const [formData, setFormData] = useState<TravelFormData>({
        destination: initialDestination,
        origin_city: "",
        start_date: today,
        end_date: today,
        traveler_count: 1,
        budget_style: 'mid-range',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Basic date validation
        if (new Date(formData.start_date) > new Date(formData.end_date)) {
            console.error("Start date cannot be after end date.");
            setIsSubmitting(false);
            return;
        }

        // The onSubmit function will handle sending the data to your API
        console.log("Submitting travel plan data:", formData);
        onSubmit(formData);
        setIsSubmitting(false);
        onClose();
    };


    const inputClasses = "w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-sky-400 focus:border-sky-400 transition";
    const labelClasses = "block text-sm font-semibold mb-1 text-slate-300";

    return (
        // Modal Backdrop
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            {/* Modal Content Card */}
            <div className="bg-[#0d1226] text-white p-6 md:p-8 rounded-xl shadow-2xl max-w-lg w-full transform transition-all scale-100 opacity-100 border border-sky-400/50">
                <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-3">
                    <h2 className="text-2xl font-bold text-sky-400">Plan Your Trip</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition text-3xl font-light leading-none">
                        &times;
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Destination */}
                    <div>
                        <label htmlFor="destination" className={labelClasses}>Destination (Country/City)</label>
                        <input
                            id="destination"
                            name="destination"
                            type="text"
                            value={formData.destination}
                            onChange={handleChange}
                            required
                            className={inputClasses}
                        />
                    </div>

                    {/* Origin City */}
                    <div>
                        <label htmlFor="origin_city" className={labelClasses}>Origin City (For Flight Estimates)</label>
                        <input
                            id="origin_city"
                            name="origin_city"
                            type="text"
                            placeholder="e.g., London, Paris, New York"
                            value={formData.origin_city}
                            onChange={handleChange}
                            required
                            className={inputClasses}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Start Date */}
                        <div>
                            <label htmlFor="start_date" className={labelClasses}>Start Date</label>
                            <input
                                id="start_date"
                                name="start_date"
                                type="date"
                                value={formData.start_date}
                                min={today}
                                onChange={handleChange}
                                required
                                className={inputClasses}
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label htmlFor="end_date" className={labelClasses}>End Date</label>
                            <input
                                id="end_date"
                                name="end_date"
                                type="date"
                                value={formData.end_date}
                                min={formData.start_date}
                                onChange={handleChange}
                                required
                                className={inputClasses}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Traveler Count */}
                        <div>
                            <label htmlFor="traveler_count" className={labelClasses}>Travelers</label>
                            <input
                                id="traveler_count"
                                name="traveler_count"
                                type="number"
                                min="1"
                                value={formData.traveler_count}
                                onChange={handleChange}
                                required
                                className={inputClasses}
                            />
                        </div>

                        {/* Budget Style */}
                        <div>
                            <label htmlFor="budget_style" className={labelClasses}>Budget Style</label>
                            <select
                                id="budget_style"
                                name="budget_style"
                                value={formData.budget_style}
                                onChange={handleChange}
                                required
                                className={inputClasses}
                            >
                                <option value="economy">Economy (Backpacker)</option>
                                <option value="mid-range">Mid-Range (Comfort)</option>
                                <option value="luxury">Luxury (High-End)</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 space-x-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-sky-600 rounded-lg font-bold text-white hover:bg-sky-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Generating Plan...' : 'Generate Plan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- START: Chat Modal Component ---

// ──────────────────────────────────────────────────────────────────────
//  ChatModal – now renders the full TravelPlan nicely
// ──────────────────────────────────────────────────────────────────────
interface ChatMessage {
    role: 'user' | 'assistant';
    content: React.ReactNode;
}

interface ChatModalProps {
    onClose: () => void;
    initialData: TravelFormData;
}

const DEFAULT_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb';

const TravelPlanComponent: React.FC<{ plan: TravelPlan }> = ({ plan }) => {
    return (
        <div className="space-y-6 text-sm">
            {/* Header */}
            <div className="border-b border-sky-500/30 pb-3">
                <h3 className="text-xl font-bold text-sky-400">{plan.label}</h3>
                <p className="mt-1">
                    <strong>Destination:</strong> {plan.destination}
                </p>
                <p>
                    <strong>Dates:</strong> {plan.trip_dates}
                </p>
            </div>

            {/* Summary */}
            <div>
                <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-sky-300">Trip Summary</h4>
                <TTSPlayButton text={plan.summary} voiceId={DEFAULT_VOICE_ID} />
                </div>
                <p className="whitespace-pre-wrap">{plan.summary}</p>
            </div>

            {/* Budget */}
            <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-sky-300 mb-2">Budget</h4>
                <p className="text-lg font-medium">
                    Total: <span className="text-green-400">${plan.budget_analysis.total_estimated_cost_usd.toLocaleString()}</span>
                </p>
                <ul className="mt-2 space-y-1">
                    {plan.budget_analysis.cost_breakdown.map((c, i) => (
                        <li key={i} className="flex justify-between">
                            <span>{c.category}</span>
                            <span className="text-green-300">
                                ${c.estimated_cost_usd.toLocaleString()}
                            </span>
                            {c.notes && <span className="text-xs text-slate-400 ml-2">– {c.notes}</span>}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Activities */}
            <div>
                <h4 className="font-semibold text-sky-300 mb-2">Day-by-Day Itinerary</h4>
                <div className="space-y-3">
                    {plan.recommended_activities.map((act, i) => (
                        <div
                            key={i}
                            className="bg-slate-800/40 rounded-lg p-3 flex flex-col sm:flex-row sm:justify-between gap-2"
                        >
                            <div>
                                <strong className="text-sky-200">{act.day}</strong> – {act.activity}
                                {act.notes && <p className="text-xs text-slate-400 mt-1">{act.notes}</p>}
                            </div>
                            <div className="text-green-300 font-medium">
                                ${act.estimated_cost_usd.toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Logistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/40 rounded-lg p-3">
                    <h5 className="font-medium text-sky-300">Flights</h5>
                    <p className="text-xs">{plan.logistics.flights_notes}</p>
                </div>
                <div className="bg-slate-800/40 rounded-lg p-3">
                    <h5 className="font-medium text-sky-300">Accommodation</h5>
                    <p className="text-xs">{plan.logistics.accommodation_recommendation}</p>
                </div>
                <div className="bg-slate-800/40 rounded-lg p-3">
                    <h5 className="font-medium text-sky-300">Visa / Entry</h5>
                    <p className="text-xs">{plan.logistics.visa_or_entry_requirements}</p>
                </div>
                <div className="bg-slate-800/40 rounded-lg p-3">
                    <h5 className="font-medium text-sky-300">Local Transport</h5>
                    <p className="text-xs">{plan.logistics.transport_notes}</p>
                </div>
            </div>

            {/* Assumptions */}
            {plan.assumptions.length > 0 && (
                <div>
                    <h4 className="font-semibold text-sky-300 mb-1">Assumptions</h4>
                    <ul className="list-disc list-inside text-xs space-y-0.5">
                        {plan.assumptions.map((a, i) => (
                            <li key={i}>{a}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Sources */}
            {plan.sources.length > 0 && (
                <div>
                    <h4 className="font-semibold text-sky-300 mb-1">Sources</h4>
                    <ul className="list-disc list-inside text-xs space-y-0.5">
                        {plan.sources.map(s => (
                            <li key={s.id}>
                                <a
                                    href={s.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sky-400 hover:underline"
                                >
                                    {s.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const ChatModal: React.FC<ChatModalProps> = ({ onClose, initialData }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);

    // ---- initial plan -------------------------------------------------
    useEffect(() => {
        fetchInitialPlan();
    }, []);

const [conversationHistory, setConversationHistory] = useState<
  { role: 'user' | 'assistant'; content: string }[]
>([]);

const fetchInitialPlan = async () => {
  setLoading(true);
  try {
    const res = await fetch('/api/travel_agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initialData),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();

    // --- SAFE: Check if data exists ---
    if (!json?.data || typeof json.data !== 'object') {
      throw new Error('Invalid response format');
    }

    const plan = json.data as TravelPlan;

    // --- Validate label ---
    if (plan.label !== 'Travel Itinerary Synthesis') {
      throw new Error('Unexpected plan structure');
    }

    const hist = Array.isArray(json.history) ? json.history : [];

    setConversationHistory(hist);
    setMessages([{ role: 'assistant', content: <TravelPlanComponent plan={plan} /> }]);
  } catch (err) {
    console.error('Initial plan error:', err);
    setMessages([{
      role: 'assistant',
      content: (
        <div className="text-red-400">
          <strong>Error:</strong> Failed to generate plan. Please try again.
        </div>
      )
    }]);
  } finally {
    setLoading(false);
  }
};

const handleSend = async () => {
  if (!input.trim()) return;

  const userMsg: ChatMessage = { role: 'user', content: input };
  const newMsgs = [...messages, userMsg];
  setMessages(newMsgs);
  setInput('');
  setLoading(true);

  try {
    const res = await fetch('/api/travel_agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...initialData,
        query: input,
        history: conversationHistory,
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();

    // --- SAFE: Validate response ---
    if (!json?.data || typeof json.data !== 'object') {
      throw new Error('Invalid response from server');
    }

    const plan = json.data as TravelPlan;

    if (plan.label !== 'Travel Itinerary Synthesis') {
      throw new Error('Model returned unexpected format');
    }

    const hist = Array.isArray(json.history) ? json.history : [];

    setConversationHistory(hist);
    setMessages([...newMsgs, { role: 'assistant', content: <TravelPlanComponent plan={plan} /> }]);
  } catch (err) {
    console.error('Follow-up error:', err);
    setMessages([...newMsgs, {
      role: 'assistant',
      content: (
        <div className="text-red-400">
          <strong>Error:</strong> Could not update plan. Please try again.
        </div>
      )
    }]);
  } finally {
    setLoading(false);
  }
};

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#0d1226] text-white p-6 md:p-8 rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-sky-400/50">
                {/* Header */}
                <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
                    <h2 className="text-2xl font-bold text-sky-400">Travel Agent Chat</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition text-3xl font-light leading-none">
                        ×
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#444 #121528' }}>
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`p-4 rounded-lg max-w-[90%] ${
                                msg.role === 'user' ? 'bg-sky-600/50 ml-auto' : 'bg-slate-700/60'
                            }`}
                        >
                            <strong className="block mb-1">{msg.role === 'user' ? 'You' : 'Agent'}:</strong>
                            {msg.content}
                        </div>
                    ))}
                    {loading && <div className="text-center text-slate-400 animate-pulse">Thinking…</div>}
                </div>

                {/* Input */}
                <div className="mt-4 flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder="Ask to change dates, add activities, etc…"
                        className="flex-1 p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-sky-400 focus:border-sky-400 transition"
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading}
                        className="px-5 py-2 bg-sky-600 rounded-lg font-bold text-white hover:bg-sky-500 transition disabled:opacity-50"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};
// --- END: New Modal Component and Logic ---


export default function WorldComparePage({}: {}) {
    const [countries, setCountries] = useState<Record<string, CountryStats>>({});
    const [showModal, setShowModal] = useState(false);
    const [selectedTravelCountry, setSelectedTravelCountry] = useState<string>('');
    const [chatOpen, setChatOpen] = useState(false);
    const [travelData, setTravelData] = useState<TravelFormData | null>(null);


    // Default to the user's comparison countries
    const [weatherData, setWeatherData] = useState<Record<string, MonthlyAverage[]>>({});

    const params = useSearchParams();
    const countryA = params.get("a") ?? "CN";
    const countryB = params.get("b") ?? "US";


    const [healthLoading, setHealthLoading] = useState<Record<string, boolean>>({});
    const [healthReport, setHealthReport] = useState<Record<string, string>>({});
    const [healthStats, setHealthStats] = useState<Record<string, any>>({});

    // Fetch country stats
    useEffect(() => {
        getCountryData([countryA, countryB]).then(setCountries);
        fetchWeatherData(countryA);
        fetchWeatherData(countryB);
    }, [countryA, countryB]);
    console.log(countries);

    // Fetch weather data for a country
    const fetchWeatherData = async (country: string) => {
        try {
            const res = await fetch(`/api/weather?country=${country}`);
            const data = await res.json();
            if (data.monthlyAverages) {
                setWeatherData(prev => ({ ...prev, [country]: data.monthlyAverages }));
            }
        } catch (err) {
            console.error(`Error fetching weather data for ${country}:`, err);
        }
    };

    // Function to open the modal with the selected country pre-filled
    const handleTravelClick = (countryName: string) => {
        setSelectedTravelCountry(countryName);
        setShowModal(true);
    };

    // Function to handle the form data submission
    const handlePlanSubmit = (data: TravelFormData) => {
        setTravelData(data);
        setChatOpen(true);
    }

const handleHealthReport = async (countryName: string) => {
  setHealthLoading(prev => ({ ...prev, [countryName]: true }));
  try {
    const res = await fetch("/api/health_report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: countryName }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed");
    setHealthReport(prev => ({ ...prev, [countryName]: json.report })); // markdown string
    setHealthStats(prev => ({ ...prev, [countryName]: json.stats }));
  } catch (e) {
    setHealthReport(prev => ({
      ...prev,
      [countryName]: `**Error:** ${(e as Error).message}`,
    }));
  } finally {
    setHealthLoading(prev => ({ ...prev, [countryName]: false }));
  }
};

    const renderInfoBox = (title: string, content: React.ReactNode) => (
        <div style={{
            background: "rgba(30, 34, 63, 0.8)",
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
            boxShadow: "0 0 6px rgba(0,0,0,0.3)",
            backdropFilter: "blur(6px)"
        }}>
            <h1 style={{fontSize:20, fontWeight: "bold", marginBottom: 5}}>{title}</h1>
            <div style={{ fontSize: 13 }}>{content}</div>
        </div>
    );

    const renderCountryCard = (name: string) => {
        const data = countries[name];
        if (!data) return null;

        const monthly = weatherData[name] ?? [];

        const statsLeft = [
            { label: "Population", value: data.population?.toLocaleString() ?? "N/A" },
            { label: "Land Area (km²)", value: data.landArea?.toLocaleString() ?? "N/A" },
            { label: "GDP per Capita (USD)", value: data.gdpPerCapita?.toLocaleString() ?? "N/A" },
            { label: "Avg Years of Education", value: data.avgEducationYears ?? "N/A" },
            { label: "Homicide Rate (/100,000)", value: data.homicideRate ?? "N/A" },
        ];

        const statsRight = [
            { label: "Energy Use per Capita (KWh)", value: data.energyUsePerCapita ?? "N/A" },
            { label: "Happiness (0-10)", value: data.happiness ?? "N/A" },
            { label: "Military Expenditure (% GDP)", value: data.militaryExpenditure ?? "N/A" },
            { label: "Electricity Access (%)", value: data.electricityAccess ?? "N/A" },
        ];

        const fergusLeft = [
            { label: "Avg Living Languages (Established)", value: data.AverageNumberOfLanguagesEstablishedLivingLanguages ?? "N/A" },
            { label: "Avg Living Languages (Immigrant)", value: data.AverageNumberOfLanguagesImmigrantLivingLanguages ?? "N/A" },
            { label: "% of World’s Living Languages", value: data.AverageNumberOfLanguagesPercentOfWorldsLivingLanguages ?? "N/A" },
            { label: "Total Living Languages", value: data.AverageNumberOfLanguagesTotalLivingLanguages ?? "N/A" },
            { label: "Official/National Language(s)", value: data.LanguagesOfficialOrNationalLanguage ?? "N/A" },
            { label: "National Dish", value: data.CountriesNationalDishes ?? "N/A" },
            // { label: "Country Motto", value: data.CountryMottos ?? "N/A" },
            { label: "Date Sovereignty Acquired", value: data.OldestCountries_DateSovereignityAcquired ?? "N/A" },
            { label: "Current Government Established", value: data.OldestCountries_DateCurrentFormOfGovernmentEstablished ?? "N/A" },
            { label: "Legally Required Paid Vacation (Days/Year)", value: data.AverageVacationDays_LegallyRequiredMinimumPaidVacationDaysPerYear_days_YearFree ?? "N/A" },
            { label: "Total Minimum Paid Leave (Days/Year)", value: data.AverageVacationDays_MinimumTotalPaidLeave_days_YearFree ?? "N/A" },
        ];

        const fergusRight = [
            { label: "Avocado Consumption (kg, 2022)", value: data.AvocadoConsumption_2022 ?? "N/A" },
            { label: "Banana Consumption (Total, 2022)", value: data.BananaConsumption_2022 ?? "N/A" },
            { label: "Banana Consumption per Capita (kg, 2022)", value: data.BananaConsumptionPerCapita_2022 ?? "N/A" },
            { label: "Beer Consumption Rate (2022)", value: data.BeerConsumptionRate_2022 ?? "N/A" },
            { label: "Egg Consumption (Total, 2022)", value: data.EggConsumptionTotal_2022 ?? "N/A" },
            { label: "Egg Consumption per Capita (kg, 2022)", value: data.EggConsumptionPerCapita_2022 ?? "N/A" },
            { label: "Facebook Users (2025)", value: data.FacebookUsers_2025?.toLocaleString() ?? "N/A" },
            { label: "Facebook Users (Male %)", value: data.FacebookUsersPctMale_2025 ?? "N/A" },
            { label: "Facebook Users (Female %)", value: data.FacebookUsersPctFemale_2025 ?? "N/A" },
        ];

        const renderWeatherChart = () => {
            if (!monthly.length) return <div>Data Not Found</div>;

            const width = 300;
            const height = 150;
            const padding = 40;

            const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

            const highTemps = monthly.map(m => m.avg_high_temp_C ?? 0);
            const lowTemps = monthly.map(m => m.avg_low_temp_C ?? 0);
            const precipitation = monthly.map(m => m.avg_precip_mm ?? 0);

            const maxTemp = Math.max(...highTemps);
            const minTemp = Math.min(...lowTemps);
            const maxPrecip = Math.max(...precipitation);

            const tempScale = (temp: number) => height - padding - ((temp - minTemp) / (maxTemp - minTemp)) * (height - 2 * padding);
            const precipScale = (precip: number) => height - padding - (precip / maxPrecip) * (height - 2 * padding);

            const tempHighPath = highTemps.map((t, i) => `${(i / 11) * (width - 2 * padding) + padding},${tempScale(t)}`).join(" ");
            const tempLowPath = lowTemps.map((t, i) => `${(i / 11) * (width - 2 * padding) + padding},${tempScale(t)}`).join(" ");
            const precipPath = precipitation.map((p, i) => `${(i / 11) * (width - 2 * padding) + padding},${precipScale(p)}`).join(" ");

            const avgHigh = highTemps.reduce((a,b) => a+b,0)/highTemps.length;
            const avgLow = lowTemps.reduce((a,b) => a+b,0)/lowTemps.length;
            const totalPrecip = precipitation.reduce((a,b) => a+b,0);

            return (
                <div style={{ display: "flex", gap: 8}}>
                    {/* Weather Summary */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ fontSize: 18, flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                            <div>Average Temp: {((avgHigh+avgLow)/2).toFixed(1)}°C</div>
                            <div>High Temp: {Math.max(...highTemps).toFixed(1)}°C</div>
                            <div>Low Temp: {Math.min(...lowTemps).toFixed(1)}°C</div>
                            <div>Total rainfall: {totalPrecip.toFixed(1)} mm</div>
                        </div>
                    </div>

                    {/* Chart with title and legend */}
                    <div style={{ flex: 1 }}>
                        <svg width={width} height={height}>
                            <rect x={0} y={0} width={width} height={height} fill="#1b1f3b" rx={8} />

                            {/* Title */}
                            <text x={width/2} y={20} fill="#fff" fontSize={14} fontWeight="bold" textAnchor="middle">
                                Monthly Weather Overview
                            </text>

                            {/* Legend - moved above plot area */}
                            <g>
                                <rect x={padding} y={25} width={10} height={10} fill="#ff4d4d" />
                                <text x={padding + 15} y={35} fill="#fff" fontSize={10}>High Temp</text>

                                <rect x={padding + 80} y={25} width={10} height={10} fill="#4da6ff" />
                                <text x={padding + 95} y={35} fill="#fff" fontSize={10}>Low Temp</text>

                                <line x1={padding + 160} y1={30} x2={padding + 170} y2={30} stroke="#ffcc00" strokeWidth={2} strokeDasharray="4 2" />
                                <text x={padding + 175} y={35} fill="#fff" fontSize={10}>Precipitation</text>
                            </g>

                            {/* Y-axis labels */}
                            {[minTemp, (minTemp+maxTemp)/2, maxTemp].map((t,i) => (
                                <text key={i} x={padding-5} y={tempScale(t)} fill="#fff" fontSize={10} textAnchor="end">
                                    {t.toFixed(0)}°C
                                </text>
                            ))}

                            {/* X-axis labels */}
                            {months.map((m,i) => (
                                <text key={i} x={(i/11)*(width-2*padding)+padding} y={height-5} fill="#fff" fontSize={10} textAnchor="middle">
                                    {m}
                                </text>
                            ))}

                            {/* High temp line */}
                            <polyline points={tempHighPath} fill="none" stroke="#ff4d4d" strokeWidth={2} />
                            {/* Low temp line */}
                            <polyline points={tempLowPath} fill="none" stroke="#4da6ff" strokeWidth={2} />
                            {/* Precipitation line */}
                            <polyline points={precipPath} fill="none" stroke="#ffcc00" strokeWidth={2} strokeDasharray="4 2" />
                        </svg>
                    </div>
                </div>
            );
        };


        return (
            <div style={{
                flex: 1,
                background: "#0e1328", // a bit deeper blue-black for contrast
                color: "#eaeefb",
                borderRadius: 12,
                border: "1px solid #222",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
                height: "100%",

                /* --- Scrollbar styling --- */
                scrollbarWidth: "thin",            // Firefox
                scrollbarColor: "#444 #121528",    // thumb + track
            }} >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 20,
                        textAlign: "center",
                    }}
                >
                    {data?.flagUrl && (
                        <img
                            src={data.flagUrl}
                            alt={`${name} flag`}
                            style={{ width: 75, height: 45, objectFit: "cover", borderRadius: 4 }}
                        />
                    )}
                    <div>
                        <h1 style={{ fontSize: 36, fontWeight: "bold", margin: 0 }}>{name}</h1>
                        <h3>Motto: {data.CountryMottos}</h3>
                    </div>
                    {data?.flagUrl && (
                        <img
                            src={data.flagUrl}
                            alt={`${name} flag`}
                            style={{ width: 75, height: 45, objectFit: "cover", borderRadius: 4 }}
                        />
                    )}
                </div>

                {renderInfoBox("Stats", (
                    <div style={{ display: "flex", gap: 16 }}>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                            {statsLeft.map((s, i) => (
                                <div key={i}><strong>{s.label}:</strong> {s.value}</div>
                            ))}
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                            {statsRight.map((s, i) => (
                                <div key={i}><strong>{s.label}:</strong> {s.value}</div>
                            ))}
                        </div>
                    </div>
                ))}

                {renderInfoBox("Top Songs", (
                    <ol style={{ paddingLeft: 0, margin: 0 }}>
                        {data.topSongs?.songs?.slice(0, 5).map((song, i) => {
                            const [artist, ...titleParts] = song.rank.split(" - ");
                            const title = titleParts.join(" - ");
                            const isTop1 = i === 0;
                            return (
                                <li
                                    key={i}
                                    style={{
                                        marginBottom: 8,
                                        fontSize: isTop1 ? 16 : 12,
                                        fontWeight: isTop1 ? "bold" : "bold",
                                        color: isTop1 ? "#fffa72" : "#eaeefb",
                                    }}
                                >
                                    <span style={{ marginRight: 8 }}>{i + 1}.</span>
                                    <span style={{ fontStyle: "italic" }}>{title}</span>
                                    {artist ? ` by ${artist}` : ""}
                                </li>
                            );
                        }) || <li>Data Not Found</li>}
                    </ol>
                ))}

<div style={{ marginTop: "auto", width: "100%" }}>
  <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
    {/* Travel Button */}
    <button
      onClick={() => handleTravelClick(name)}
      style={{
        ...glowBtnStyle,
        width: "80%",
      }}
    >
      Plan Travel to {name}
    </button>

    {/* Health Report Button */}
    <button
      onClick={() => handleHealthReport(name)}
      style={{
        ...glowBtnStyle,
        background: "linear-gradient(90deg, #00c853, #00e676, #00c853)",
        backgroundSize: "200% 200%",
        animation: "glowAnim 3s ease infinite",
        boxShadow: "0 0 6px #00c853, 0 0 12px #00e676, 0 0 18px #00c853",
        width: "80%",
      }}
    >
      {healthLoading[name] ? (
        <>
          <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          Generating…
        </>
      ) : (
        <>Generate Health & Wellbeing Report</>
      )}
    </button>
  </div>

{healthReport[name] && (
  <div className="mt-4 space-y-3 w-full">
    {/* Short Preview (first 2 blocks) */}
    <div className="p-4 bg-slate-800/60 rounded-lg border border-green-500/30 text-sm prose prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {
          healthReport[name]
            .split('\n\n')
            .slice(0, 2)
            .join('\n\n')
        }
      </ReactMarkdown>
    </div>

    {/* Full Report Link */}
    <Link
      href={`/health-report/${encodeURIComponent(name)}`}
      className="block text-center px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-semibold text-sm transition"
      onClick={() => {
        const key = `health_report_${name}`;
        localStorage.setItem(
          key,
          JSON.stringify({
            report: healthReport[name],   // markdown
            stats: healthStats[name],
            country: name,
            timestamp: Date.now(),
          }),
        );
      }}
    >
      View Full Report
    </Link>
  </div>
)}
</div>

                {renderInfoBox("Weather", renderWeatherChart())}

                {renderInfoBox("Fergus Stats",
                    <div style={{ display: "flex", gap: 16 }}>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                            {fergusLeft.map((s, i) => (
                                <div key={i}><strong>{s.label}:</strong> {s.value}</div>
                            ))}
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                            {fergusRight.map((s, i) => (
                                <div key={i}><strong>{s.label}:</strong> {s.value}</div>
                            ))}
                        </div>
                    </div>)}
            </div>
        );
    };

    return (
        <>
            <style>{`
                @keyframes glowAnim {
                    0% { background-position: 0% 50%; box-shadow: 0 0 6px #ff00ff, 0 0 12px #00ffff, 0 0 18px #ff00ff; }
                    50% { background-position: 100% 50%; box-shadow: 0 0 12px #00ffff, 0 0 18px #ff00ff, 0 0 24px #00ffff; }
                    100% { background-position: 0% 50%; box-shadow: 0 0 6px #ff00ff, 0 0 12px #00ffff, 0 0 18px #ff00ff; }
                }
            `}</style>

            <div style={{ display: "flex", flexDirection: "row", gap: 16, padding: 16, height: "100vh" }}>
                {renderCountryCard(countryA)}

                <div style={{
                    flex: 0.5,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 24,
                }}>
                    
                    {/* Merge Link */}
                    <Link style={glowMergeBtnStyle} className="text-center" href={`/merge?a=${countryA}&b=${countryB}`}>
                        Merge
                    </Link>
                    
                </div>

                {renderCountryCard(countryB)}
            </div>

            {/* Modal Renderer */}
            {showModal && (
                <TravelModal
                    initialDestination={selectedTravelCountry}
                    onClose={() => setShowModal(false)}
                    onSubmit={handlePlanSubmit}
                />
            )}
            {chatOpen && travelData && (
                <ChatModal
                    onClose={() => setChatOpen(false)}
                    initialData={travelData}
                />
            )}
        </>
    );
}

export const glowBtnStyle: React.CSSProperties = {
  width: "80%",
  padding: "16px 0",
  borderRadius: 16,
  border: "none",
  fontWeight: "bold",
  fontSize: 16,
  cursor: "pointer",
  color: "#fff",
  background: "linear-gradient(90deg, #ff00ff, #00ffff, #ff00ff)",
  backgroundSize: "200% 200%",
  animation: "glowAnim 3s ease infinite",
  boxShadow: "0 0 6px #ff00ff, 0 0 12px #00ffff, 0 0 18px #ff00ff",
  textShadow: "0 0 3px #fff, 0 0 6px #ff00ff",
};

// danger version (more red, subtle orange for warmth)
export const glowMergeBtnStyle: React.CSSProperties = {
  width: "80%",
  padding: "16px 0",
  borderRadius: 16,
  border: "1px solid rgba(255, 72, 72, 0.45)",
  fontWeight: "bold",
  fontSize: 16,
  cursor: "pointer",
  color: "#fff",
  background:
    "linear-gradient(90deg, #ff3b3b, #ff0044, #ff7a18, #ff3b3b)", // red → crimson → warm orange → red
  backgroundSize: "220% 220%",
  animation: "glowAnim 3s ease infinite",
  boxShadow:
    "0 0 8px rgba(255, 42, 42, 0.9), 0 0 16px rgba(255, 0, 68, 0.75), 0 0 24px rgba(255, 42, 42, 0.6)",
  textShadow: "0 0 3px #fff, 0 0 8px rgba(255, 42, 42, 0.9)",
};
