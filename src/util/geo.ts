// utils/geo.ts
import { feature as topojsonFeature } from "topojson-client";

// ---------------------------------------
// Types
// ---------------------------------------
export type MP = number[][][][]; // MultiPolygon: poly[] -> ring[] -> [x,y][]

// ---------------------------------------
// Geometry helpers
// ---------------------------------------
export function polygonArea(ring: number[][]): number {
  let a = 0;
  for (let i = 0, n = ring.length - 1; i < n; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2; // signed
}


export function unwrapRingClosed(ring: [number, number][]): [number, number][] {
  if (!ring || ring.length === 0) return ring;

  // Detect closure in input (Natural Earth rings are typically closed)
  const closedIn = ring.length > 2 &&
                   ring[0][0] === ring[ring.length - 1][0] &&
                   ring[0][1] === ring[ring.length - 1][1];

  const n = closedIn ? ring.length - 1 : ring.length;
  const out: [number, number][] = new Array(n);

  let offset = 0;
  let prevLon = ring[0][0];

  for (let i = 0; i < n; i++) {
    let [lon, lat] = ring[i];
    const d = lon - prevLon;
    if (d > 180) offset -= 360;
    else if (d < -180) offset += 360;
    lon = lon + offset;
    out[i] = [lon, lat];
    prevLon = ring[i][0]; // use original (unshifted) to measure next jump
  }

  // If the input was closed, close the unwrapped ring *at the same offset*.
  // That ensures the return-to-start is local, not a 360° leap.
  if (closedIn) {
    const first = out[0];
    return [...out, [first[0], first[1]]];
  } else {
    return out;
  }
}

export function unwrapPolyClosed(poly: [number, number][][]): [number, number][][] {
  return poly.map(unwrapRingClosed);
}

export function polyNetArea(poly: number[][][]): number {
  let a = 0;
  for (const ring of poly) a += polygonArea(ring);
  return Math.abs(a);
}

export function multiPolyArea(mpoly: MP): number {
  let total = 0;
  for (const poly of mpoly) {
    for (const ring of poly) total += polygonArea(ring);
  }
  return Math.abs(total);
}

export function ringCentroid(ring: number[][]): [number, number] {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, n = ring.length - 1; i < n; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    const cross = x1 * y2 - x2 * y1;
    a += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  a *= 0.5;
  if (a === 0) return [ring[0][0], ring[0][1]];
  cx /= 6 * a;
  cy /= 6 * a;
  return [cx, cy];
}

export function multiPolyCentroid(mpoly: MP): [number, number] {
  let aTotal = 0, cxTotal = 0, cyTotal = 0;
  for (const poly of mpoly) {
    for (const ring of poly) {
      const a = polygonArea(ring);
      const [cx, cy] = ringCentroid(ring);
      aTotal += a;
      cxTotal += cx * a;
      cyTotal += cy * a;
    }
  }
  if (aTotal === 0) return mpoly[0][0][0] as [number, number];
  return [cxTotal / aTotal, cyTotal / aTotal];
}

export function transformMultiPolygon(
  mpoly: MP,
  fn: (p: [number, number]) => [number, number]
): MP {
  return mpoly.map(poly => poly.map(ring => ring.map(([x, y]) => fn([x, y]))));
}

export function closeRings(mpoly: MP): MP {
  return mpoly.map(poly =>
    poly.map(ring => {
      const n = ring.length;
      if (!n) return ring;
      const [fx, fy] = ring[0];
      const [lx, ly] = ring[n - 1];
      if (fx === lx && fy === ly) return ring;
      return [...ring, [fx, fy]];
    })
  );
}

// ---------------------------------------
// Geo helpers
// ---------------------------------------
export function geoFeatureToMultiPolygon(
  feature: any,
  project: (lnglat: [number, number]) => [number, number] | null
): MP {
  const type = feature?.geometry?.type;
  const coords = feature?.geometry?.coordinates;
  const toXY = (c: [number, number]) => (project(c) || [NaN, NaN]) as [number, number];

  if (type === "Polygon") {
    const unwrapped = unwrapPolyClosed(coords as [number, number][][]);
    const rings = unwrapped.map((ring) => ring.map(([lon, lat]) => toXY([lon, lat])));
    return [rings];
  }

  if (type === "MultiPolygon") {
    return (coords as [number, number][][][]).map((poly) => {
      const unwrapped = unwrapPolyClosed(poly);
      return unwrapped.map((ring) => ring.map(([lon, lat]) => toXY([lon, lat])));
    });
  }

  return [];
}

export function mpolyToSvgPath(mpoly: MP): string {
  const parts: string[] = [];
  for (const poly of mpoly) {
    for (const ring of poly) {
      if (!ring.length) continue;
      parts.push(
        `M${ring[0][0]},${ring[0][1]} ` +
          ring.slice(1).map(([x, y]) => `L${x},${y}`).join(" ") +
          " Z"
      );
    }
  }
  return parts.join(" ");
}

export function keepLargestPolygon(mpoly: MP): MP {
  if (!mpoly || !mpoly.length) return mpoly;
  let best = mpoly[0];
  let bestA = polyNetArea(best);
  for (let i = 1; i < mpoly.length; i++) {
    const a = polyNetArea(mpoly[i]);
    if (a > bestA) {
      best = mpoly[i];
      bestA = a;
    }
  }
  return [best];
}

export function dropSmallIslands(mpoly: MP, minRatio = 0.03): MP {
  if (!mpoly || !mpoly.length) return mpoly;
  const areas = mpoly.map(polyNetArea);
  const maxA = Math.max(...areas);
  return mpoly.filter((_, i) => areas[i] / maxA >= minRatio);
}

// ---------------------------------------
// Centering / scaling helpers
// ---------------------------------------
export function computeBBox(mpoly: MP) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const poly of mpoly) {
    for (const ring of poly) {
      for (const [x, y] of ring) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

export function makeCenterScaler(
  basis: MP,
  width: number,
  height: number,
  pad = 16
) {
  const { minX, minY, maxX, maxY } = computeBBox(basis);
  const bw = Math.max(1, maxX - minX);
  const bh = Math.max(1, maxY - minY);

  const sx = (width - 2 * pad) / bw;
  const sy = (height - 2 * pad) / bh;
  const s = Math.min(sx, sy);

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const targetX = width / 2;
  const targetY = height / 2;

  const apply = (mp: MP) =>
    transformMultiPolygon(mp, ([x, y]) => {
      const X = (x - cx) * s + targetX;
      const Y = (y - cy) * s + targetY;
      return [X, Y];
    });

  return { apply, s };
}

export function centerAndScale(
  mpoly: MP,
  width: number,
  height: number,
  pad = 16
): MP {
  const { apply } = makeCenterScaler(mpoly, width, height, pad);
  return apply(mpoly);
}

// ---------------------------------------
// Data loader
// ---------------------------------------
export async function loadCountries(): Promise<any[]> {
  const url = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load world atlas");
  const topo = await res.json();
  const geo = topojsonFeature(topo, (topo as any).objects.countries) as any;

  // Ensure .properties.name exists consistently
  return geo.features.map((f: any) => ({
    ...f,
    properties: {
      id: f.id,
      name: f.properties?.name || String(f.id),
    },
  }));
}

// ---------------------------------------
// Name normalization + finder
// ---------------------------------------
export function normalize(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

export function stripDiacritics(s: string) {
  return s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeLoose(s: string) {
  return stripDiacritics(s)
    .toLowerCase()
    .replace(/['’`.,()-]/g, " ")
    .replace(/&/g, " and ")
    .replace(
      /\b(the|and|of|state|states|republic|democratic|people|plurinational|federal|federated|arab|bolivarian|united|socialist|kingdom)\b/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeTight(s: string) {
  return stripDiacritics(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

export function tokenOverlap(a: string, b: string) {
  const A = new Set(a.split(" ").filter(Boolean));
  const B = new Set(b.split(" ").filter(Boolean));
  const inter = [...A].filter(x => B.has(x)).length;
  return inter / Math.max(1, Math.min(A.size, B.size));
}

export function makeCountryFinder(features: any[]) {
  const byKey = new Map<string, any>();

  for (const f of features) {
    const name = f?.properties?.name as string;
    if (!name) continue;
    const keys = new Set<string>([
      normalizeLoose(name),
      normalizeTight(name),
      normalizeLoose(name.replace(/\./g, "")), // e.g., "Dem Rep Congo"
    ]);
    for (const k of keys) byKey.set(k, f);
  }

  // IMPORTANT: aliases map to **dataset names** (Natural Earth short names)
  const aliasToDatasetName: Record<string, string> = {
    usa: "United States of America",
    us: "United States of America",
    "united states": "United States of America",
    uk: "United Kingdom",
    uae: "United Arab Emirates",
    ivorycoast: "Côte d'Ivoire",
    "cote divoire": "Côte d'Ivoire",
    czech: "Czechia",
    russia: "Russia",
    "russian federation": "Russia",
    southkorea: "Korea, Republic of",
    northkorea: "Korea, Democratic People's Republic of",
    laos: "Lao People's Democratic Republic",
    vietnam: "Viet Nam",
    brunei: "Brunei Darussalam",
    tanzania: "Tanzania",
    syria: "Syrian Arab Republic",
    iran: "Iran (Islamic Republic of)",
    bolivia: "Bolivia",
    venezuela: "Venezuela",
    moldova: "Moldova",
    drc: "Dem. Rep. Congo",
    "democratic republic of the congo": "Dem. Rep. Congo",
    "republic of the congo": "Congo",
    "cape verde": "Cabo Verde",
    "east timor": "Timor-Leste",
    burma: "Myanmar",
    swaziland: "Eswatini",
    palestine: "Palestine",
    vatican: "Holy See",
    micronesia: "Micronesia",
    "czech republic": "Czechia",
    eswatini: "Eswatini",
    "türkiye": "Turkey", // Natural Earth still "Turkey" in this file
    "cote d'ivoire": "Côte d'Ivoire",
    "cote d ivoire": "Côte d'Ivoire",
    "dominican republic": "Dominican Rep.",
    "equatorial guinea": "Eq. Guinea",
    "solomon islands": "Solomon Is.",
    "marshall islands": "Marshall Is.",
    "falkland islands": "Falkland Is.",
  };

  return (name: string) => {
    if (!name) return null;

    const nTight = normalizeTight(name);
    const nLoose = normalizeLoose(name);

    const aliasHit =
      aliasToDatasetName[nTight] ||
      aliasToDatasetName[nLoose] ||
      aliasToDatasetName[name.toLowerCase().trim()];

    const target = aliasHit || name;

    // exact / near-exact
    const exact =
      byKey.get(normalizeLoose(target)) ||
      byKey.get(normalizeTight(target)) ||
      byKey.get(normalizeLoose(target.replace(/\./g, "")));
    if (exact) return exact;

    // contains / reverse-contains
    for (const [k, f] of byKey) {
      if (k.includes(nLoose) || nLoose.includes(k)) return f;
    }

    // token-overlap fallback
    let best: { f: any; score: number } | null = null;
    for (const [k, f] of byKey) {
      const score = tokenOverlap(k, nLoose);
      if (!best || score > best.score) best = { f, score };
    }
    if (best && best.score >= 0.6) return best.f;

    return null;
  };
}
