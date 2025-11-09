import React, { useState } from 'react';
import { MergeInput } from '../lib/types';

interface CountryInputFormProps {
  onGenerate: (input: MergeInput) => void;
  isLoading: boolean;
}

const examplePairs = [
  { a: 'South Korea', b: 'Nigeria' },
  { a: 'Canada', b: 'Chile' },
  { a: 'Germany', b: 'Vietnam' },
  { a: 'Australia', b: 'Morocco' },
  { a: 'India', b: 'Egypt' },
];

const CountryInputForm: React.FC<CountryInputFormProps> = ({ onGenerate, isLoading }) => {
  const [countryA, setCountryA] = useState('Japan');
  const [countryB, setCountryB] = useState('Brazil');
  const [showOptions, setShowOptions] = useState(false);
  const [yearsForward, setYearsForward] = useState(10);
  const [nameStyle, setNameStyle] = useState<'portmanteau' | 'neutral' | 'historic'>('portmanteau');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanA = countryA.trim();
    const cleanB = countryB.trim();

    if (!cleanA || !cleanB) {
      setFormError('Please enter both country names.');
      return;
    }
    if (cleanA.toLowerCase() === cleanB.toLowerCase()) {
      setFormError('Please enter two different countries.');
      return;
    }

    onGenerate({
      country_a: cleanA,
      country_b: cleanB,
      options: {
        years_forward: yearsForward,
        name_style: nameStyle,
      },
    });
  };

  const handleTryExample = () => {
    const pair = examplePairs[Math.floor(Math.random() * examplePairs.length)];
    setCountryA(pair.a);
    setCountryB(pair.b);
    setFormError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <input
          type="text"
          value={countryA}
          onChange={(e) => setCountryA(e.target.value)}
          placeholder="Enter first country (e.g., Japan)"
          className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
          required
          aria-label="First country name"
        />
        <input
          type="text"
          value={countryB}
          onChange={(e) => setCountryB(e.target.value)}
          placeholder="Enter second country (e.g., Brazil)"
          className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
          required
          aria-label="Second country name"
        />
      </div>

      <div>
        <button type="button" onClick={() => setShowOptions(!showOptions)} className="text-cyan-400 hover:text-cyan-300 transition text-sm">
          {showOptions ? 'Hide' : 'Show'} Advanced Options
        </button>
      </div>

      {showOptions && (
        <div className="bg-gray-700/50 p-4 rounded-lg space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label htmlFor="nameStyle" className="block text-sm font-medium text-gray-300 mb-1">New Name Style</label>
                <select 
                    id="nameStyle" 
                    value={nameStyle} 
                    onChange={(e) => setNameStyle(e.target.value as any)}
                    className="w-full bg-gray-600 border-gray-500 rounded-md px-3 py-2 text-white focus:ring-cyan-500 focus:border-cyan-500"
                >
                    <option value="portmanteau">Portmanteau (e.g., Japazil)</option>
                    <option value="neutral">Neutral (e.g., Republic of the Sun)</option>
                    <option value="historic">Historic (e.g., Empire of the Dawn)</option>
                </select>
            </div>
            <div>
                <label htmlFor="yearsForward" className="block text-sm font-medium text-gray-300 mb-1">Scenario Horizon (Years)</label>
                <input
                    type="number"
                    id="yearsForward"
                    value={yearsForward}
                    onChange={(e) => setYearsForward(parseInt(e.target.value, 10))}
                    min="1"
                    max="50"
                    className="w-full bg-gray-600 border-gray-500 rounded-md px-3 py-2 text-white focus:ring-cyan-500 focus:border-cyan-500"
                />
            </div>
          </div>
        </div>
      )}

      {formError && <p className="text-red-400 text-center -mt-2 mb-2">{formError}</p>}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-10 rounded-lg shadow-lg transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:scale-100"
        >
          {isLoading ? 'Generating...' : 'Fuse Countries'}
        </button>
         <button
          type="button"
          onClick={handleTryExample}
          disabled={isLoading}
          className="w-full sm:w-auto bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-transform transform hover:scale-105 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:scale-100"
        >
          Randomize
        </button>
      </div>
    </form>
  );
};

export default CountryInputForm;
