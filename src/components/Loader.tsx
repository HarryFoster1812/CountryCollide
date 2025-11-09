import React, { useState, useEffect } from 'react';

export const loadingMessages = [
  'Consulting global atlases...',
  'Analyzing cultural synergies...',
  'Forecasting economic futures...',
  'Simulating geopolitical shifts...',
  'Drafting a new constitution...',
  'Weaving together national flags...',
  'Reconciling public holidays...',
  'Translating idioms without losing the jokes...',
  'Balancing civil and common law traditions...',
  'Blending culinary staples into a national menu...',
  'Comparing school curricula and exam seasons...',
  'Mapping time zones and daylight savings...',
  'Estimating migration flows...',
  'Aggregating World Bank indicators...',
  'Cross-checking life expectancy and literacy...',
  'Projecting sectoral growth paths...',
  'Normalizing census categories...',
  'Inferring bilingual signage policy...',
  'Calibrating HDI-like proxies...',
  'Harmonizing tax codes (the fun part)...',
  'Merging telecom country codes...',
  'Designing a federal vs unitary compromise...',
  'Allocating seats in a new legislature...',
  'Negotiating anthem tempo and key...',
  'Reconciling traffic rules and road signs...',
  'Aligning labor norms and leave policies...',
  'Stress-testing currency and central banking...',
  'Selecting a capital (no favoritism, promise)...',
  'Tracing trade routes and port capacity...',
  'Fact-checking everything twice...',
  'De-duplicating city names...',
  'Estimating carbon footprint trajectories...',
  'Drafting minority language protections...',
  'Benchmarking broadband and infrastructure...',
  'Modeling disaster preparedness standards...',
  'Plotting population pyramids...',
  'Balancing regional autonomy with cohesion...',
  'Curating a shared museum collection...',
  'Stitching together railway gauges...',
  'Picking a country top-level domain...',
];

const Loader: React.FC = () => {
  const [message, setMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessage(prevMessage => {
        const currentIndex = loadingMessages.indexOf(prevMessage);
        const nextIndex = (currentIndex + 1) % loadingMessages.length;
        return loadingMessages[nextIndex];
      });
    }, 2500);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center my-12 space-y-4">
      <p className="text-lg text-gray-400 text-center px-4">{message}</p>
    </div>
  );
};

export default Loader;
