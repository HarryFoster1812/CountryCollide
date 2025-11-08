// countryApi.js
/**
 * Fetch country data by name from a local JSON file
 * @param {string} countryName
 * @returns {Promise<{
 *   name: string,
 *   population?: number,
 *   landArea?: number,
 *   flagUrl?: string,
 *   gdpPerCapita?: number,
 *   avgEducationYears?: number,
 *   homicideRate?: number,
 *   energyUsePerCapita?: number,
 *   happiness?: number,
 *   militaryExpenditure?: number,
 *   electricityAccess?: number
 * }>}
 */
export async function getCountryData(countryNames) {
    try {
        // The file should be in "public/country_data.json"
        const response = await fetch("/country_data.json");
        if (!response.ok) {
            throw new Error(`Failed to load country data: ${response.status}`);
        }

        const data = await response.json();

        let full_data = [];

        for (let country_name of countryNames) {
            let country = data[country_name];
            if (country) {
                full_data[country_name] = {
                    name: country_name,
                    landArea: country["Land area (sq. km)"]?.value ?? null,
                    gdpPerCapita: country["GDP per capita ($)"]?.value ?? null,
                    avgEducationYears: country["Average years of education"]?.value ?? null,
                    homicideRate: country["Homicide rate per 100,100"]?.value ?? null,
                    energyUsePerCapita: country["Energy use per capita (KWh/person)"]?.value ?? null,
                    happiness: country["Happiness (0-10)"]?.value ?? null,
                    militaryExpenditure: country["Military expenditure (% of GDP)"]?.value ?? null,
                    electricityAccess: country["Electricity Access %"]?.value ?? null,
                    flagUrl: `https://flagsapi.com/${country.code2}/flat/64.png`
                }
            }
        }

        return full_data;
    } catch (err) {
        console.error("Error fetching country data:", err);
        return null;
    }
}
