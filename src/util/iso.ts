import isoToNum from '@/data/iso_to_num.json'; // build-time import

export type IsoToNumMap = Record<string, number>;

/** Async shim so server code can `await loadIsoToNum()` */
export async function loadIsoToNum(): Promise<IsoToNumMap> {
  // normalize keys to UPPERCASE once
  const out: IsoToNumMap = {};
  for (const [k, v] of Object.entries(isoToNum as Record<string, number>)) {
    out[k.toUpperCase()] = Number(v);
  }
  return out;
}
