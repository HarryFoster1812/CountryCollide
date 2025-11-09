"use client";

import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";

// Keep Feature loose so callers can pass GeoJSON features without extra types
export type Feature = any;

export type GlobeHandle = {
  pointOfView: (pov: { lat: number; lng: number; altitude?: number }, ms?: number) => void;
};

export type GlobeCanvasProps = {
  height?: number;
  backgroundColor?: string;
  features: Feature[];
  selectedKeys: Set<string>;
  getCountryKey: (f: Feature) => string;
  getFeatureCentroid: (f: Feature) => [number, number];
  onToggleCountry?: (f: Feature) => void;
  globeImageUrl?: string;
  bumpImageUrl?: string;
};

const DEFAULT_BG = "#0b1020";

const GlobeCanvas = forwardRef<GlobeHandle, GlobeCanvasProps>(
  (
    {
      height = 600,
      backgroundColor = DEFAULT_BG,
      features,
      selectedKeys,
      getCountryKey,
      getFeatureCentroid,
      onToggleCountry,
      globeImageUrl = "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
      bumpImageUrl = "//unpkg.com/three-globe/example/img/earth-topology.png",
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const globeRef = useRef<any>(null);

    // Build / rebuild globe when container + features ready
    useEffect(() => {
      if (!containerRef.current || features.length === 0) return;

      let cleanupResize: (() => void) | undefined;
      let cancelled = false;

      (async () => {
        const GlobeJS = (await import("globe.gl")).default;
        if (cancelled) return;

        const globe = GlobeJS()(containerRef.current)
          .width(containerRef.current.clientWidth)
          .height(height)
          .backgroundColor(backgroundColor)
          .showAtmosphere(true)
          .atmosphereAltitude(0.25)
          .globeImageUrl(globeImageUrl)
          .bumpImageUrl(bumpImageUrl)
          .polygonsData(features)
          .polygonCapColor((d: Feature) =>
            selectedKeys.has(getCountryKey(d)) ? "rgba(255, 204, 0, 0.35)" : "rgba(0,0,0,0)"
          )
          .polygonSideColor(() => "rgba(0,0,0,0)")
          .polygonStrokeColor((d: Feature) =>
            selectedKeys.has(getCountryKey(d)) ? "#ffcc00" : "rgba(255,255,255,0.35)"
          )
          .polygonAltitude((d: Feature) => (selectedKeys.has(getCountryKey(d)) ? 0.02 : 0.004))
          .polygonsTransitionDuration(300)
          .onPolygonClick((poly: Feature) => {
            onToggleCountry?.(poly);
            const [lng, lat] = getFeatureCentroid(poly);
            globe.pointOfView({ lat, lng, altitude: 1.5 }, 800);
          })
          .onPolygonHover((poly: Feature | null) => {
            globe.polygonStrokeColor((d: Feature) => {
              if (selectedKeys.has(getCountryKey(d))) return "#ffcc00";
              if (poly && getCountryKey(poly) === getCountryKey(d)) return "#ffffff";
              return "rgba(255,255,255,0.35)";
            });
          });

        const onResize = () => {
          if (!containerRef.current) return;
          globe.width(containerRef.current.clientWidth);
          globe.height(height);
        };
        window.addEventListener("resize", onResize);
        cleanupResize = () => window.removeEventListener("resize", onResize);

        globeRef.current = globe;
      })();

      return () => {
        cancelled = true;
        cleanupResize?.();
        globeRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [features, height, backgroundColor]);

    // Keep visuals in sync whenever selection changes
    useEffect(() => {
      if (!globeRef.current) return;
      globeRef.current
        .polygonCapColor((d: Feature) =>
          selectedKeys.has(getCountryKey(d)) ? "rgba(255, 204, 0, 0.35)" : "rgba(0,0,0,0)"
        )
        .polygonStrokeColor((d: Feature) =>
          selectedKeys.has(getCountryKey(d)) ? "#ffcc00" : "rgba(255,255,255,0.35)"
        )
        .polygonAltitude((d: Feature) => (selectedKeys.has(getCountryKey(d)) ? 0.02 : 0.004));
    }, [selectedKeys, getCountryKey]);

    // Expose a minimal imperative API to parent
    useImperativeHandle(
      ref,
      (): GlobeHandle => ({
        pointOfView: (pov, ms) => globeRef.current?.pointOfView(pov, ms),
      }),
      []
    );

    return (
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height,
          borderRadius: 8,
          overflow: "hidden",
          background: backgroundColor,
        }}
      />
    );
  }
);

GlobeCanvas.displayName = "GlobeCanvas";

export default GlobeCanvas;



