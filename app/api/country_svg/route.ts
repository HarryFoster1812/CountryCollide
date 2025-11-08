export const runtime = "nodejs";

import { feature as topojsonFeature } from "topojson-client";
import * as d3geo from "d3-geo";
import polygonClipping from "polygon-clipping";

// -----------------------------
// Math + geometry helpers
// -----------------------------
function polygonArea(ring: number[][]): number {
  let a = 0;
  for (let i = 0, n = ring.length - 1; i < n; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2; // signed
}

function multiPolyArea(mpoly: number[][][][]): number {
  let total = 0;
  for (const poly of mpoly) {
    for (const ring of poly) total += polygonArea(ring);
  }
  return Math.abs(total);
}

function ringCentroid(ring: number[][]): [number, number] {
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

function multiPolyCentroid(mpoly: number[][][][]): [number, number] {
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

function transformMultiPolygon(
  mpoly: number[][][][],
  fn: (p: [number, number]) => [number, number]
): number[][][][] {
  return mpoly.map(poly => poly.map(ring => ring.map(([x, y]) => fn([x, y]))));
}

function closeRings(mpoly: number[][][][]): number[][][][] {
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

function geoFeatureToMultiPolygon(
  feature: any,
  project: (lnglat: [number, number]) => [number, number]
): number[][][][] {
  const type = feature.geometry.type;
  const coords = feature.geometry.coordinates;
  const toXY = (c: [number, number]) => project(c);

  if (type === "Polygon") {
    const rings = coords.map((ring: number[][]) => ring.map(([lon, lat]) => toXY([lon, lat])));
    return [rings];
  }
  if (type === "MultiPolygon") {
    return coords.map((poly: number[][][]) => poly.map(ring => ring.map(([lon, lat]) => toXY([lon, lat]))));
  }
  return [];
}

function mpolyToSvgPath(mpoly: number[][][][]): string {
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

// Largest polygon helper (to keep mainland only, optional)
function polyNetArea(poly: number[][][]): number {
  let a = 0;
  for (const ring of poly) a += polygonArea(ring);
  return Math.abs(a);
}
function keepLargestPolygon(mpoly: number[][][][]): number[][][][] {
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


// Optional: drop tiny islands below a fraction of the largest polygon
function dropSmallIslands(mpoly: number[][][][], minRatio = 0.03): number[][][][] {
  if (!mpoly || !mpoly.length) return mpoly;
  const areas = mpoly.map(polyNetArea);
  const maxA = Math.max(...areas);
  return mpoly.filter((poly, i) => areas[i] / maxA >= minRatio);
}

// -----------------------------
// Data loader
// -----------------------------
// Uses the D3 Graph Gallery GeoJSON (FeatureCollection), not TopoJSON.
async function loadCountries(): Promise<any[]> {
  // Use world-atlas v2 TopoJSON (includes properties.name)
  const url = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load world atlas");
  const topo = await res.json();

  const geo = topojsonFeature(topo, (topo as any).objects.countries) as any;

  return geo.features.map((f: any) => ({
    ...f,
    properties: {
      id: f.id,
      name: f.properties?.name || String(f.id),
    },
  }));
}

function normalize(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function makeCountryFinder(features: any[]) {
  return (name: string) => {
    const aliases: Record<string, string> = {
      usa: "United States of America",
      us: "United States of America",
      uk: "United Kingdom",
      uae: "United Arab Emirates",
      ivorycoast: "Côte d’Ivoire",
      "cote divoire": "Côte d’Ivoire",
      czech: "Czechia",
      russia: "Russian Federation",
      southkorea: "Korea, Republic of",
      northkorea: "Korea, Democratic People's Republic of",
      laos: "Lao People's Democratic Republic",
      vietnam: "Viet Nam",
      brunei: "Brunei Darussalam",
      tanzania: "Tanzania, United Republic of",
      syria: "Syrian Arab Republic",
      iran: "Iran (Islamic Republic of)",
      bolivia: "Bolivia (Plurinational State of)",
      venezuela: "Venezuela (Bolivarian Republic of)",
      moldova: "Moldova, Republic of",
      drc: "Congo, Democratic Republic of the",
      "republic of the congo": "Congo",
      "cape verde": "Cabo Verde",
      "east timor": "Timor-Leste",
      burma: "Myanmar",
      swaziland: "Eswatini",
      palestine: "Palestine, State of",
      vatican: "Holy See",
      micronesia: "Micronesia (Federated States of)",
    };

    const n = normalize(name);
    const canonical = aliases[n] || name;
    const target = normalize(canonical);

    let f = features.find((g: any) => normalize(g.properties?.name) === target);
    if (f) return f;
    f = features.find((g: any) => normalize(g.properties?.name).includes(target));
    return f || null;
  };
}

// -----------------------------
// Main handler
// -----------------------------
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const a = url.searchParams.get("a");
    if (!a) {
      return new Response(
        JSON.stringify({ error: "Missing required query params ?a=CountryA" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const mainlandOnly = url.searchParams.get("mainland") === "true"; // optional flag
    const width = Number(url.searchParams.get("w") || 800);
    const height = Number(url.searchParams.get("h") || 520);
    const stroke = url.searchParams.get("stroke") || "#111";
    const strokeWidth = Number(url.searchParams.get("strokeWidth") || 2);
    const fill = url.searchParams.get("fill") || "white";
    const debug = url.searchParams.get("debug") === "1";

    const features = await loadCountries();
    const find = makeCountryFinder(features);

    const fa = find(a);
    if (!fa) {
      return new Response(
        JSON.stringify({ error: `Country not found`, missing: { a: !fa } }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Projection (Equal Earth) sized to canvas
    const projection = d3geo.geoEqualEarth().translate([width / 2, height / 2]).scale(Math.min(width, height) * 0.32);

    let mA = closeRings(geoFeatureToMultiPolygon(fa, projection));

      mA = keepLargestPolygon(mA);

    const aPath = mpolyToSvgPath(mA);

    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      (aPath
        ? `<path d="${aPath}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`
        : ``) +
      `</svg>`;


    // If union failed and not in debug mode, return 500 so caller knows
    if (!aPath && !debug) {
      return new Response(
        JSON.stringify({ error: "Union failed for these inputs. Try debug=1 to inspect outlines." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(svg, { status: 200, headers: { "Content-Type": "image/svg+xml" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
