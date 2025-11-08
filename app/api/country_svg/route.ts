// app/api/country_svg/route.ts
import * as d3geo from "d3-geo";

// ---- helpers ----
function polygonArea(ring: number[][]): number {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i], [x2, y2] = ring[i + 1];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}
function closeRings(poly: number[][][]): number[][][] {
  return poly.map(ring => {
    if (!ring.length) return ring;
    const [fx, fy] = ring[0], [lx, ly] = ring[ring.length - 1];
    return fx === lx && fy === ly ? ring : [...ring, [fx, fy]];
  });
}
function geoFeatureToMultiPolygon(feature: any, project: (p: [number, number]) => [number, number]) {
  const t = feature.geometry?.type;
  const c = feature.geometry?.coordinates || [];
  if (t === "Polygon") {
    return [closeRings(c.map((r: number[][]) => r.map(([lon, lat]) => project([lon, lat]))))];
  }
  if (t === "MultiPolygon") {
    return c.map((poly: number[][][]) =>
      closeRings(poly.map((r: number[][]) => r.map(([lon, lat]) => project([lon, lat]))))
    );
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
        ring.slice(1).map(([x, y]) => `L${x},${y}`).join(" ") + " Z"
      );
    }
  }
  return parts.join(" ");
}

// ---- data loader for Holtzy GeoJSON ----
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
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

// ---- API: GET /api/country_svg?a=United%20Kingdom ----
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const a = url.searchParams.get("a");
    if (!a) {
      return new Response(JSON.stringify({ error: "Missing ?a=CountryName" }), {
        status: 400, headers: { "Content-Type": "application/json" }
      });
    }

    const width = Number(url.searchParams.get("w") || 800);
    const height = Number(url.searchParams.get("h") || 520);
    const stroke = url.searchParams.get("stroke") || "#111";
    const strokeWidth = Number(url.searchParams.get("strokeWidth") || 1.5);
    const fill = url.searchParams.get("fill") || "none";

    const features = await loadCountries();
    const targetName = normalize(a);

    // match by name (name_long or name from dataset)
    const feat = features.find((f: any) => {
      const n = normalize(f.properties?.name);
      return n === targetName || n.includes(targetName);
    });

    if (!feat) {
      return new Response(JSON.stringify({ error: `Country not found: ${a}` }), {
        status: 404, headers: { "Content-Type": "application/json" }
      });
    }

    // Project and build path
    const projection = d3geo.geoEqualEarth().translate([width / 2, height / 2]).scale(Math.min(width, height) * 0.32);
    const mpoly = geoFeatureToMultiPolygon(feat, (lnglat) => projection(lnglat) as [number, number]);
    const d = mpolyToSvgPath(mpoly);

    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>` +
      `</svg>`;

    return new Response(svg, { status: 200, headers: { "Content-Type": "image/svg+xml" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}
