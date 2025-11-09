export const runtime = "nodejs";

import * as d3geo from "d3-geo";
import polygonClipping from "polygon-clipping";
import {
  MP,
  loadCountries,
  loadIsoToNum,
  makeCountryFinderISO,
  geoFeatureToMultiPolygon,
  closeRings,
  keepLargestPolygon,
  multiPolyArea,
  multiPolyCentroid,
  transformMultiPolygon,
  makeCenterScaler,
  mpolyToSvgPath,
} from "@/util/geo";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const a = url.searchParams.get("a");
    const b = url.searchParams.get("b");

    if (!a) {
      return new Response(
        JSON.stringify({ error: "Missing required query param ?a=CountryA" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const width = Math.max(1, Number(url.searchParams.get("w") || 800));
    const height = Math.max(1, Number(url.searchParams.get("h") || 520));
    const pad = Math.max(0, Number(url.searchParams.get("pad") || 16));
    const stroke = url.searchParams.get("stroke") || "#111";
    const strokeWidth = Math.max(0, Number(url.searchParams.get("strokeWidth") || 2));
    const fill = url.searchParams.get("fill") || "white";
    const debug = url.searchParams.get("debug") === "1";

    // Data + lookup
    const features = await loadCountries();
    const isoToNum = await loadIsoToNum();
    const findByISO = makeCountryFinderISO(features, isoToNum);

    const fa = findByISO(a);
    if (!fa) {
      return new Response(JSON.stringify({ error: `Country not found: ${a}` }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const fb = b ? findByISO(b) : null;
    if (b && !fb) {
      return new Response(JSON.stringify({ error: `Country not found: ${b}` }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Projection (Equal Earth) sized to canvas center (we'll center/scale later too)
    const projection = d3geo
      .geoEqualEarth()
      .translate([width / 2, height / 2])
      .scale(Math.min(width, height) * 0.32);

    // Projected mainland for A
    let mA: MP = closeRings(
      geoFeatureToMultiPolygon(fa, (pt) => projection(pt) as [number, number])
    );
    mA = keepLargestPolygon(mA);

    // If only A is requested, just center/scale and return
    if (!fb) {
      const { apply } = makeCenterScaler(mA, width, height, pad);
      const mA3 = apply(mA);
      const aPath = mpolyToSvgPath(mA3);

      const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
        (aPath
          ? `<path d="${aPath}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`
          : ``) +
        `</svg>`;

      return new Response(svg, {
        status: 200,
        headers: { "Content-Type": "image/svg+xml" },
      });
    }

    // Projected mainland for B
    let mB: MP = closeRings(
      geoFeatureToMultiPolygon(fb, (pt) => projection(pt) as [number, number])
    );
    mB = keepLargestPolygon(mB);

    // Equalize areas & overlay around combined centroid
    const areaA = multiPolyArea(mA);
    const areaB = multiPolyArea(mB);
    const cA = multiPolyCentroid(mA);
    const cB = multiPolyCentroid(mB);

    const targetArea = Math.max(areaA || 1, areaB || 1);
    const sA = Math.sqrt(targetArea / (areaA || 1));
    const sB = Math.sqrt(targetArea / (areaB || 1));

    const scaleAround = (mp: MP, s: number, center: [number, number]) =>
      transformMultiPolygon(mp, ([x, y]) => [center[0] + (x - center[0]) * s, center[1] + (y - center[1]) * s]);

    let mA2 = scaleAround(mA, sA, cA);
    let mB2 = scaleAround(mB, sB, cB);

    const cA2 = multiPolyCentroid(mA2);
    const cB2 = multiPolyCentroid(mB2);
    const center: [number, number] = [(cA2[0] + cB2[0]) / 2, (cA2[1] + cB2[1]) / 2];

    const tA: [number, number] = [center[0] - cA2[0], center[1] - cA2[1]];
    const tB: [number, number] = [center[0] - cB2[0], center[1] - cB2[1]];
    mA2 = transformMultiPolygon(mA2, ([x, y]) => [x + tA[0], y + tA[1]]);
    mB2 = transformMultiPolygon(mB2, ([x, y]) => [x + tB[0], y + tB[1]]);

    // Boolean union (may fail if polygons are invalid; we guard for that)
    let union: MP | null = null;
    try {
      union = polygonClipping.union(mA2, mB2) as unknown as MP;
    } catch {
      union = null;
    }

    // Shared center/scale to canvas
    const basis: MP = union ? union : ([...mA2, ...mB2] as MP);
    const { apply } = makeCenterScaler(basis, width, height, pad);

    const mA3 = apply(mA2);
    const mB3 = apply(mB2);
    const union3 = union ? apply(union) : null;

    // SVG
    const aPath = mpolyToSvgPath(mA3);
    const bPath = mpolyToSvgPath(mB3);
    const unionPath = union3 ? mpolyToSvgPath(union3) : "";

    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      (debug
        ? `<path d="${aPath}" fill="none" stroke="#bbb" stroke-width="1"/>` +
          `<path d="${bPath}" fill="none" stroke="#bbb" stroke-width="1"/>`
        : ``) +
      (union3
        ? `<path d="${unionPath}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`
        : ``) +
      `</svg>`;

    if (!union3 && !debug) {
      return new Response(
        JSON.stringify({
          error: "Union failed for these inputs. Try debug=1 to inspect outlines.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(svg, {
      status: 200,
      headers: { "Content-Type": "image/svg+xml" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Internal error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
