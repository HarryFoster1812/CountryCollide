
// --- Types ---
interface SpotifySong {
    rank: string;
    title: string;
    artist: string;
    streams: string;
    link?: string;
}

interface CountryData {
    name: string;
    population?: number | null;
    landArea?: number | null;
    flagUrl?: string;
    gdpPerCapita?: number | null;
    avgEducationYears?: number | null;
    homicideRate?: number | null;
    energyUsePerCapita?: number | null;
    happiness?: number | null;
    militaryExpenditure?: number | null;
    electricityAccess?: number | null;
    topSongs?: SpotifySong[];
}

interface CountryJson {
    [key: string]: {
        code2: string;
        [key: string]: { value?: number };
    };
}

interface SpotifyJson {
    [code2: string]: SpotifySong[];
}

// --- API Function ---
export async function getCountryData(countryNames: string[]): Promise<Record<string, CountryData> | null> {
    try {
        // Load both data files in parallel
        const [countryRes, spotifyRes] = await Promise.all([
            fetch("/country_data.json"),
            fetch("/spotify_top10_by_country.json")
        ]);

        if (!countryRes.ok) throw new Error(`Failed to load country data: ${countryRes.status}`);
        if (!spotifyRes.ok) throw new Error(`Failed to load Spotify data: ${spotifyRes.status}`);

        const [countryData, spotifyData]: [CountryJson, SpotifyJson] = await Promise.all([
            countryRes.json(),
            spotifyRes.json()
        ]);

        const fullData: Record<string, CountryData> = {};

        for (const countryName of countryNames) {
            let countryKey = countryName === "England" ? "United Kingdom" : countryName;
            const country = countryData[countryKey];

            if (!country) continue;

            const spotify = spotifyData[country.code2] ?? [];

            fullData[countryName] = {
                name: countryName,
                population: country["Population"]?.value ?? null,
                landArea: country["Land area (sq. km)"]?.value ?? null,
                gdpPerCapita: country["GDP per capita ($)"]?.value ?? null,
                avgEducationYears: country["Average years of education"]?.value ?? null,
                homicideRate: country["Homicide rate per 100,100"]?.value ?? null,
                energyUsePerCapita: country["Energy use per capita (KWh/person)"]?.value ?? null,
                happiness: country["Happiness (0-10)"]?.value ?? null,
                militaryExpenditure: country["Military expenditure (% of GDP)"]?.value ?? null,
                electricityAccess: country["Electricity Access %"]?.value ?? null,
                flagUrl: `https://flagsapi.com/${country.code2}/flat/64.png`,
                topSongs: spotify
            };
        }

        return fullData;
    } catch (err) {
        console.error("Error fetching combined data:", err);
        return null;
    }
}
