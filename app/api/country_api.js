// countryApi.js
/**
 * Fetch country data by name from local JSON files (with robust alias/edge-case handling)
 * @param {string[]} countryNames
 * @returns {Promise<Record<string, {
 *   name: string,
 *   population?: number|null,
 *   landArea?: number|null,
 *   flagUrl?: string|null,
 *   gdpPerCapita?: number|null,
 *   avgEducationYears?: number|null,
 *   homicideRate?: number|null,
 *   energyUsePerCapita?: number|null,
 *   happiness?: number|null,
 *   militaryExpenditure?: number|null,
 *   electricityAccess?: number|null,
 *   topSongs?: { songs: Array<{ rank: string, title?: string, artist?: string, streams?: string, link?: string }> }
 * }>>}
 */

const JSON_PATHS = {
  country: "/country_data.json",
  spotify: "/spotify_top10_by_country.json",
  fergus: "/fergus_data.json",
};

// --- text utils -------------------------------------------------------
const stripDiacritics = (s) =>
  s.normalize("NFD").replace(/\p{Diacritic}+/gu, "");
const clean = (s) =>
  stripDiacritics(String(s).trim().toLowerCase())
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-widths
    .replace(/[’'`]/g, "")                 // quotes
    .replace(/[.\-_,]/g, " ")              // punctuation → space
    .replace(/\s+/g, " ");                 // collapse spaces

// Convert flag emoji to ISO-2 (e.g., 🇺🇸 -> US)
const isoFromFlag = (s) => {
  const codePoints = Array.from(s || "");
  if (codePoints.length !== 2) return null;
  const A = 0x1F1E6;
  const c1 = codePoints[0].codePointAt(0);
  const c2 = codePoints[1].codePointAt(0);
  if (!c1 || !c2) return null;
  const a = String.fromCharCode(((c1 - A) & 0xFFFF) + 65);
  const b = String.fromCharCode(((c2 - A) & 0xFFFF) + 65);
  return /^[A-Z]{2}$/.test(a + b) ? a + b : null;
};

// --- alias table (feel free to add more) ------------------------------
const ALIASES = (() => {
  const m = new Map();

  // United States
  [
    "us", "u.s.", "u.s", "usa", "u.s.a", "u.s.a.", "united states",
    "united states of america", "🇺🇸", "america",
  ].forEach((k) => m.set(clean(k), "United States"));

  // United Kingdom + home nations
  ["uk", "u.k.", "united kingdom", "great britain", "britain", "🇬🇧"].forEach(
    (k) => m.set(clean(k), "United Kingdom")
  );
  ["england", "scotland", "wales", "northern ireland"].forEach((k) =>
    m.set(clean(k), "United Kingdom")
  );

  // Common tricky ones
  m.set(clean("czech republic"), "Czechia");
  m.set(clean("ivory coast"), "Côte d’Ivoire");
  m.set(clean("cote d'ivoire"), "Côte d’Ivoire");
  m.set(clean("cote d ivoire"), "Côte d’Ivoire");
  m.set(clean("south korea"), "Korea, Republic of");
  m.set(clean("north korea"), "Korea, Dem. People’s Rep.");
  m.set(clean("russia"), "Russian Federation");
  m.set(clean("uae"), "United Arab Emirates");
  m.set(clean("bolivia"), "Bolivia (Plurinational State of)");
  m.set(clean("brunei"), "Brunei Darussalam");
  m.set(clean("congo"), "Congo");
  m.set(clean("dr congo"), "Congo, Dem. Rep.");
  m.set(clean("democratic republic of the congo"), "Congo, Dem. Rep.");
  m.set(clean("republic of the congo"), "Congo");
  m.set(clean("eswatini"), "Eswatini"); // already normalized
  m.set(clean("swaziland"), "Eswatini");
  m.set(clean("vatican"), "Holy See");
  m.set(clean("holy see"), "Holy See");
  m.set(clean("palestine"), "State of Palestine");
  m.set(clean("taiwan"), "Taiwan, China");
  m.set(clean("macau"), "Macao SAR, China");
  m.set(clean("hong kong"), "Hong Kong SAR, China");

  return m;
})();

// Build a fast lookup index from the big JSON once per tab load
let cachedIndex = null;
/** @param {Record<string, any>} countryData */
const buildIndex = (countryData) => {
  if (cachedIndex) return cachedIndex;

  const byName = new Map();  // canonical name -> record
  const byC2 = new Map();    // ISO2 -> canonical name
  const byC3 = new Map();    // ISO3 -> canonical name

  Object.entries(countryData || {}).forEach(([canonicalName, rec]) => {
    byName.set(canonicalName, rec);
    const c2 = rec?.code2;
    const c3 = rec?.code3;
    if (c2) byC2.set(String(c2).toUpperCase(), canonicalName);
    if (c3) byC3.set(String(c3).toUpperCase(), canonicalName);

    // Also map a cleaned version of the canonical name to itself
    byName.set(clean(canonicalName), rec);
  });

  cachedIndex = { byName, byC2, byC3 };
  return cachedIndex;
};

const resolveCanonicalName = (raw, index) => {
  if (!raw) return null;
  const trimmed = String(raw).trim();

  // Flag emoji?
  const iso2FromFlag = isoFromFlag(trimmed);
  if (iso2FromFlag && index.byC2.has(iso2FromFlag)) {
    return index.byC2.get(iso2FromFlag);
  }

  const c = clean(trimmed);

  // Direct alias match
  if (ALIASES.has(c)) return ALIASES.get(c);

  // If it looks like an ISO2/ISO3 code
  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    const iso2 = trimmed.toUpperCase();
    if (index.byC2.has(iso2)) return index.byC2.get(iso2);
  }
  if (/^[A-Za-z]{3}$/.test(trimmed)) {
    const iso3 = trimmed.toUpperCase();
    if (index.byC3.has(iso3)) return index.byC3.get(iso3);
  }

  // Try cleaned canonical name
  if (index.byName.has(c)) return c; // this is the cleaned key we stored

  // Last-chance light fuzzy: remove commas/words like "republic", "state of"
  const stripped = c
    .replace(/\b(republic|state|dem|democratic|people?s|arab|federal|plurinational|sar)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // try alias table again after strip
  if (ALIASES.has(stripped)) return ALIASES.get(stripped);

  // try scanning country names by cleaned form containment
  for (const [name] of index.byName.entries()) {
    if (typeof name === "string" && name.includes(stripped) && index.byName.get(name)?.code2) {
      // return the *canonical* name for this cleaned key
      const rec = index.byName.get(name);
      // Find the original canonical entry that produced this cleaned key
      // We stored the cleaned name pointing to the same rec; find its proper name via ISO2
      const c2 = rec.code2?.toUpperCase();
      if (c2 && index.byC2.has(c2)) return index.byC2.get(c2);
    }
  }

  return null;
};

export async function getCountryData(countryNames) {
  if (!Array.isArray(countryNames) || countryNames.length === 0) {
    console.warn("getCountryData: called without country names");
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

  const index = buildIndex(countryData);
  const full_data = {};

  for (const inputName of countryNames) {
    // Resolve a canonical name present in country_data.json
    const resolved = resolveCanonicalName(inputName, index);

    if (!resolved) {
      // Couldn’t resolve—return a stub so callers don’t crash
      full_data[inputName] = {
        name: inputName,
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

    // Pull the actual record
    const rec =
      countryData[resolved] ||
      // If `resolved` came back as a cleaned key, find the true canonical via ISO2
      (() => {
        const maybe = index.byName.get(resolved);
        if (maybe?.code2 && index.byC2.has(String(maybe.code2).toUpperCase())) {
          const canonical = index.byC2.get(String(maybe.code2).toUpperCase());
          return countryData[canonical];
        }
        return maybe;
      })();

    // If still no record, return stub
    if (!rec) {
      full_data[inputName] = {
        name: inputName,
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

    const code2 = String(rec.code2 || "").toUpperCase();
    const spotify = spotifyData?.[code2] || [];
    const fergus = fergusData?.[code2] || {};

    full_data[inputName] = {
      name: inputName, // preserve caller's label ("USA" shows as USA)
      population: rec["Population"]?.value ?? null,
      landArea: rec["Land area (sq. km)"]?.value ?? null,
      gdpPerCapita: rec["GDP per capita ($)"]?.value ?? null,
      avgEducationYears: rec["Average years of education"]?.value ?? null,
      homicideRate: rec["Homicide rate per 100,100"]?.value ?? null, // keep key as in your dataset
      energyUsePerCapita: rec["Energy use per capita (KWh/person)"]?.value ?? null,
      happiness: rec["Happiness (0-10)"]?.value ?? null,
      militaryExpenditure: rec["Military expenditure (% of GDP)"]?.value ?? null,
      electricityAccess: rec["Electricity Access %"]?.value ?? null,
      flagUrl: code2 ? `https://flagsapi.com/${code2}/flat/64.png` : null,
      topSongs: { songs: Array.isArray(spotify) ? spotify : [] }, // always { songs: [...] } for UI
      ...fergus, // merge your extra fergus stats
    };
  }

  return full_data;
}
