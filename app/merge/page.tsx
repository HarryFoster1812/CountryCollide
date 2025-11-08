"use client"
import CountryCollisionLoader from "./CountryCollisionLoader"; 
 import { useSearchParams } from 'next/navigation'

export default function PageWithCollisionLoader() {
  // In a real app, you might get these from a global state, a config, or search params
       const params = useSearchParams();

  const country1 = (params.get("a") ?? "Canada");
  const country2 = (params.get("b") ?? "United States"); 

  const isLoading = true; // Your application's actual loading state

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">
      {isLoading ? (
        <CountryCollisionLoader 
          countryA={country1} 
          countryB={country2} 
        />
      ) : (
        <div className="text-xl">
          Content Loaded!
        </div>
      )}
    </div>
  );
}
