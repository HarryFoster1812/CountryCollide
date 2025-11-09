'use client';

import React, { useState, useCallback } from 'react';
import { FictionalCountry, MergeInput } from '@/lib/types';
import CountryInputForm from '@/components/CountryInputForm';
import ResultDisplay from '@/components/ResultDisplay';
import Loader from '@/components/Loader';
import ErrorDisplay from '@/components/ErrorDisplay';
import Header from '@/components/Header';
import Hero from '@/components/Hero';

const MergePage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FictionalCountry | null>(null);

  const handleGenerate = useCallback(async (input: MergeInput) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
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
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Hero />
        <div className="bg-gray-800 shadow-2xl rounded-lg p-6 md:p-8 max-w-4xl mx-auto">
          <CountryInputForm onGenerate={handleGenerate} isLoading={isLoading} />
        </div>
        
        {isLoading && <Loader />}
        {error && <ErrorDisplay message={error} />}
        {result && !isLoading && (
          <div className="mt-12 max-w-6xl mx-auto">
            <ResultDisplay data={result} />
          </div>
        )}
      </main>
      <footer className="text-center py-6 text-gray-500 text-sm">
        <p>Powered by Gemini API. Fictional data for illustrative purposes only.</p>
      </footer>
    </div>
  );
};

export default MergePage;
