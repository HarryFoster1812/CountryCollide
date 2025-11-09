export const runtime = "nodejs";

import * as d3geo from "d3-geo";
import {
  loadCountries,
  makeCountryFinderISO,
    loadIsoToNum,
  geoFeatureToMultiPolygon,
  closeRings,
  keepLargestPolygon,
  centerAndScale,
  mpolyToSvgPath,
  MP,
} from "@/util/geo";

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

    const width = Number(url.searchParams.get("w") || 800);
    const height = Number(url.searchParams.get("h") || 520);
    const stroke = url.searchParams.get("stroke") || "#111";
    const strokeWidth = Number(url.searchParams.get("strokeWidth") || 2);
    const fill = url.searchParams.get("fill") || "white";
    const debug = url.searchParams.get("debug") === "1";

    // Example usage somewhere else:
    const features = await loadCountries();
    const isoToNum = await loadIsoToNum();
    const findByISO = makeCountryFinderISO(features, isoToNum);



    const fa = findByISO(a);
    if (!fa) {
      return new Response(
        JSON.stringify({ error: `Country not found`, missing: { a: !fa } }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Projection (Equal Earth) sized to canvas
    const projection = d3geo
      .geoEqualEarth()
      .translate([width / 2, height / 2])
      .scale(Math.min(width, height) * 0.32);

    // Mainland-only
    let mA: MP = closeRings(
      geoFeatureToMultiPolygon(fa, (pt) => projection(pt) as [number, number])
    );
    mA = keepLargestPolygon(mA); // <--- always keep only mainland
    mA = centerAndScale(mA, width, height, /*pad=*/16);

    const aPath = mpolyToSvgPath(mA);

    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      (aPath
        ? `<path d="${aPath}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`
        : ``) +
      `</svg>`;

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
