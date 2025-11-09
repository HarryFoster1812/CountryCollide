"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from 'next/link';

import { getCountryData } from "../api/country_api.js"; 

// Mock type definitions for compilation safety
interface CountryStats {
    name: string;
    population?: number;
    gdpPerCapita?: number;
    landArea?: number;
    flagUrl?: string;
    avgEducationYears?: string;
    homicideRate?: string;
    energyUsePerCapita?: string;
    happiness?: string;
    militaryExpenditure?: string;
    electricityAccess?: string;
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

// --- END: New Modal Component and Logic ---


export default function WorldComparePage({}: {}) {
    const [countries, setCountries] = useState<Record<string, CountryStats>>({});
    const [showModal, setShowModal] = useState(false);
    const [selectedTravelCountry, setSelectedTravelCountry] = useState<string>('');
    const [travelPlan, setTravelPlan] = useState<TravelFormData | null>(null); // State to hold the submitted plan

    const params = useSearchParams();

    // Default to the user's comparison countries
    const countryA = params.get("a") ?? "Canada";
    const countryB = params.get("b") ?? "United States";

    useEffect(() => {
        getCountryData([countryA, countryB]).then(setCountries);
    }, [countryA, countryB]);

    // Function to open the modal with the selected country pre-filled
    const handleTravelClick = (countryName: string) => {
        setSelectedTravelCountry(countryName);
        setShowModal(true);
    };

    // Function to handle the form data submission
    const handlePlanSubmit = (data: TravelFormData) => {
        setTravelPlan(data);
        console.log("Travel plan generated and stored in state. You can now send this data to your /api/travel endpoint:", data);
        // NOTE: This is where you would trigger your API call (fetch('/api/travel', { body: JSON.stringify(data) }))
    }

    const renderInfoBox = (title: string, content: React.ReactNode) => (
        <div style={{
            background: "rgba(30, 34, 63, 0.8)",
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
            boxShadow: "0 0 6px rgba(0,0,0,0.3)",
            backdropFilter: "blur(6px)"
        }}>
            <h3 style={{ fontSize: 14, fontWeight: "bold", marginBottom: 6 }}>{title}</h3>
            <div style={{ fontSize: 13 }}>{content}</div>
        </div>
    );

    const renderCountryCard = (name: string) => {
        const data = countries[name];
        if (!data) return null;

        // Prepare stats
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

        return (
            <div style={{
                flex: 1,
                background: "#0d1226",
                color: "#eaeefb",
                borderRadius: 12,
                border: "1px solid #222",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
                height: "100%"
            }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                    {data?.flagUrl && (
                        <img src={data.flagUrl} alt={`${name} flag`} style={{ width: 50, height: 30, objectFit: "cover", borderRadius: 4, marginRight: 8 }} />
                    )}
                    <h2 style={{ fontSize: 18, fontWeight: "bold" }}>{name}</h2>
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
                    <ol style={{ paddingLeft: 20, margin: 0 }}>
                        {data.topSongs?.songs
                            ?.slice(0, 5)
                            .map((song, i) => {
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
                            }) || <li>N/A</li>}
                    </ol>
                ))}

                {/* NEW BUTTON: Plan Travel */}
                <button
                    onClick={() => handleTravelClick(name)}
                    style={{ ...glowBtnStyle, marginTop: 'auto', marginBottom: '8px' }} // Use flex to push it to the bottom
                >
                    Plan Travel to {name}
                </button>

                {renderInfoBox("Weather", "Average temp, climate type...")}
                {renderInfoBox("Culture", "Languages, traditions, festivals...")}
            </div>
        );
    };



    return (
        <>
            {/* Keyframes injected safely */}
            <style>{`
                @keyframes glowAnim {
                    0% { background-position: 0% 50%; box-shadow: 0 0 6px #ff00ff, 0 0 12px #00ffff, 0 0 18px #ff00ff; }
                    50% { background-position: 100% 50%; box-shadow: 0 0 12px #00ffff, 0 0 18px #ff00ff, 0 0 24px #00ffff; }
                    100% { background-position: 0% 50%; box-shadow: 0 0 6px #ff00ff, 0 0 12px #00ffff, 0 0 18px #ff00ff; }
                }
            `}</style>

            <div style={{ display: "flex", flexDirection: "row", gap: 16, padding: 16, height: "100vh" }}>
                {/* Left Sidebar */}
                {renderCountryCard(countryA)}

                {/* Center Column with Buttons */}
                <div style={{
                    flex: 0.5,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 24,
                }}>
                    {/* Kept other buttons */}
                    {["Music", "Culture"].map((text, i) => (
                        <button key={i} style={glowBtnStyle}>{text}</button>
                    ))}
                    
                    {/* Merge Link */}
                    <Link style={glowMergeBtnStyle} className="text-center" href={`/merge?a=${countryA}&b=${countryB}`}>
                        Merge
                    </Link>
                    
                    {/* Display feedback after plan submission */}
                    {travelPlan && (
                        <div className="text-center p-4 bg-green-900/50 rounded-lg text-sm max-w-full">
                            <p className="text-green-300 font-bold mb-1">Plan Parameters Submitted!</p>
                            <p className="text-xs text-green-200">Trip to **{travelPlan.destination}** ({travelPlan.traveler_count} people, {travelPlan.budget_style} style).</p>
                            <p className="text-xs text-green-200">This data is now ready to be sent to your travel API endpoint.</p>
                        </div>
                    )}

                </div>

                {/* Right Sidebar */}
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
