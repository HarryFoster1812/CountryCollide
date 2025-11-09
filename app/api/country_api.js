const JSON_PATHS = {
  country: "/country_data.json",
  spotify: "/spotify_top10_by_country.json",
  fergus: "/fergus_data.json",
};

export async function getCountryData(countryCodes) {
  if (!Array.isArray(countryCodes) || countryCodes.length === 0) {
    console.warn("getCountryData: called without country codes");
    return {};
  }

  // Fetch all three in parallel, with resilient errors
  let countryRes, spotifyRes, fergusRes;
  try {
    [countryRes, spotifyRes, fergusRes] = await Promise.all([
      fetch(JSON_PATHS.country).catch((e) => ({ ok: false, statusText: e?.message || "fetch failed" })),
      fetch(JSON_PATHS.spotify).catch((e) => ({ ok: false, statusText: e?.message || "fetch failed" })),
      fetch(JSON_PATHS.fergus).catch((e) => ({ ok: false, statusText: e?.message || "fetch failed" })),
    ]);
  } catch (err) {
    console.error("getCountryData: network error", err);
    return {};
  }

  if (!countryRes?.ok) {
    console.error(`Failed to load country data: ${countryRes?.status} ${countryRes?.statusText || ""}`.trim());
    return {};
  }
  if (!spotifyRes?.ok) {
    console.warn(`Failed to load Spotify data: ${spotifyRes?.status} ${spotifyRes?.statusText || ""}`.trim());
  }
  if (!fergusRes?.ok) {
    console.warn(`Failed to load Fergus data: ${fergusRes?.status} ${fergusRes?.statusText || ""}`.trim());
  }

  const [countryData, spotifyData = {}, fergusData = {}] = await Promise.all([
    countryRes.json().catch(() => ({})),
    spotifyRes.ok ? spotifyRes.json().catch(() => ({})) : Promise.resolve({}),
    fergusRes.ok ? fergusRes.json().catch(() => ({})) : Promise.resolve({}),
  ]);

  const full_data = {};

  for (const inputCodeRaw of countryCodes) {
    const iso2 = String(inputCodeRaw || "").trim().toUpperCase();

    // ISO-2 only; anything else → null stub
    if (!/^[A-Z]{2}$/.test(iso2)) {
      full_data[inputCodeRaw] = {
        name: inputCodeRaw,
        population: null,
        landArea: null,
        gdpPerCapita: null,
        avgEducationYears: null,
        homicideRate: null,
        energyUsePerCapita: null,
        happiness: null,
        militaryExpenditure: null,
        electricityAccess: null,
        flagUrl: null,
        topSongs: { songs: [] },
      };
      continue;
    }

    // Find the record where rec.code2 matches this ISO-2
    const rec =
      Object.values(countryData).find(
        (r) => String(r?.code2 || "").toUpperCase() === iso2
      ) || null;

    if (!rec) {
      // No match → null stub
      full_data[inputCodeRaw] = {
        name: inputCodeRaw,
        population: null,
        landArea: null,
        gdpPerCapita: null,
        avgEducationYears: null,
        homicideRate: null,
        energyUsePerCapita: null,
        happiness: null,
        militaryExpenditure: null,
        electricityAccess: null,
        flagUrl: null,
        topSongs: { songs: [] },
      };
      continue;
    }

    // Use ISO-2 “Code” key for spotify & fergus
    const code = iso2;
    const spotify = spotifyData?.[code] || [];
    const fergus = fergusData?.[code] || {};

    full_data[inputCodeRaw] = {
      // preserve the caller's label (the ISO-2 code they passed)
      name: inputCodeRaw,
      population: rec["Population"]?.value ?? null,
      landArea: rec["Land area (sq. km)"]?.value ?? null,
      gdpPerCapita: rec["GDP per capita ($)"]?.value ?? null,
      avgEducationYears: rec["Average years of education"]?.value ?? null,
      // keep your dataset's exact key spelling
      homicideRate: rec["Homicide rate per 100,100"]?.value ?? null,
      energyUsePerCapita: rec["Energy use per capita (KWh/person)"]?.value ?? null,
      happiness: rec["Happiness (0-10)"]?.value ?? null,
      militaryExpenditure: rec["Military expenditure (% of GDP)"]?.value ?? null,
      electricityAccess: rec["Electricity Access %"]?.value ?? null,
      flagUrl: `https://flagsapi.com/${code}/flat/64.png`,
      topSongs: { songs: Array.isArray(spotify) ? spotify : [] },
      ...fergus, // merge your extra fergus stats (looked up by ISO-2 code)
    };
  }

  return full_data;
}
