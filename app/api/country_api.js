// countryApi.js
/**
 * Fetch country data by name from local JSON files
 * @param {string[]} countryNames
 * @returns {Promise<{
 *   [countryName: string]: {
 *     name: string,
 *     population?: number,
 *     landArea?: number,
 *     flagUrl?: string,
 *     gdpPerCapita?: number,
 *     avgEducationYears?: number,
 *     homicideRate?: number,
 *     energyUsePerCapita?: number,
 *     happiness?: number,
 *     militaryExpenditure?: number,
 *     electricityAccess?: number,
 *     topSongs?: Array<{
 *       rank: string,
 *       title: string,
 *       artist: string,
 *       streams: string,
 *       link?: string
 *     }>
 *   }
 * }>}
 */

export async function getCountryData(countryNames) {
    try {
        // Load both data files in parallel
        const [countryRes, spotifyRes] = await Promise.all([
            fetch("/country_data.json"),
            fetch("/spotify_top10_by_country.json")
        ]);

        if (!countryRes.ok) throw new Error(`Failed to load country data: ${countryRes.status}`);
        if (!spotifyRes.ok) throw new Error(`Failed to load Spotify data: ${spotifyRes.status}`);

        const [countryData, spotifyData] = await Promise.all([
            countryRes.json(),
            spotifyRes.json()
        ]);

        const full_data = {};

        for (let country_name of countryNames) {
            let country;
            if (country_name === "England") {
                country = countryData["United Kingdom"];
            } else {
                country = countryData[country_name];
            }

            if (country) {
                const spotify = spotifyData[country.code2];
                full_data[country_name] = {
                    name: country_name,
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
                    topSongs: spotify ?? [] // attach Spotify top 10 songs
                };
            }
        }

        return full_data;
    } catch (err) {
        console.error("Error fetching combined data:", err);
        return null;
    }
}
