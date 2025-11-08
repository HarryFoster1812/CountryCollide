// countryApi.js
/**
 * Fetch country data by name
 * @param {string} countryName
 * @returns {Promise<{name: string, population: number, area: number, flagUrl: string, gdp?: number}>}
 */
export async function getCountryData(countryName) {
    try {
        
        const country = data[0];

        return {
            name: country.name.common,
            population: country.population,
            landArea: country.area, // in km²
            flagUrl: country.flags?.png || country.flags?.svg || "",
            gdp: Math.floor(Math.random() * 1000000), // Mock GDP in millions for now
        };
    } catch (err) {
        console.error("Error fetching country data:", err);
        return null;
    }
}
