// app/merge/page.tsx (Server Component)
import { feature } from "topojson-client";
import HybridClient from "./HybridClient";

export default async function Page() {
  const res = await fetch(
    "https://cdn.jsdelivr.net/npm/world-atlas@2/world/110m.json",
    {
      // cache on the server for a day; tweak to taste
      next: { revalidate: 60 * 60 * 24 },
      cache: "force-cache",
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch world data: ${res.status} ${res.statusText}`);
  }

  const topo = await res.json(); // TopoJSON
  const countries = feature(topo, topo.objects.countries); // GeoJSON FC

  return <HybridClient countries={countries as any} />;
}
