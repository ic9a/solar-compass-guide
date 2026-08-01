import { useEffect, useRef, useState } from "react";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import type { Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { COUNTIES, normalizeCountyName } from "@/data/countyPotential";
import { createSolarLocation, type SolarLocation } from "@/lib/solarLocation";

type Props = {
  value: SolarLocation;
  onCoordinateSelect: (location: SolarLocation) => void;
  resolving?: boolean;
  resolutionFailed?: boolean;
  onRetryResolution?: () => void;
};

const countyByShape = new Map(COUNTIES.map((county) => [county.shapeName, county]));

function nearestCounty(lat: number, lng: number) {
  return COUNTIES.reduce((best, county) => {
    const bestDistance = Math.hypot(best.lat - lat, best.lng - lng);
    const distance = Math.hypot(county.lat - lat, county.lng - lng);
    return distance < bestDistance ? county : best;
  }, COUNTIES[0]);
}

export function SolarExplorerMap({
  value,
  onCoordinateSelect,
  resolving = false,
  resolutionFailed = false,
  onRetryResolution,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<MapLibreMarker | null>(null);
  const onCoordinateSelectRef = useRef(onCoordinateSelect);
  const initialValueRef = useRef(value);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  onCoordinateSelectRef.current = onCoordinateSelect;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    const initialValue = initialValueRef.current;

    Promise.all([
      import("maplibre-gl"),
      fetch("/data/romania-counties.geojson").then(async (response) => {
        if (!response.ok) throw new Error(`GeoJSON HTTP ${response.status}`);
        return response.json() as Promise<FeatureCollection<Geometry, GeoJsonProperties>>;
      }),
    ])
      .then(([maplibre, rawGeoJson]) => {
        if (cancelled || !containerRef.current) return;

        const geoJson: FeatureCollection<Geometry, GeoJsonProperties> = {
          ...rawGeoJson,
          features: rawGeoJson.features.map((feature) => {
            const shapeName = normalizeCountyName(String(feature.properties?.shapeName ?? ""));
            const county = countyByShape.get(shapeName);
            return {
              ...feature,
              properties: {
                ...feature.properties,
                shapeName,
                countyName: county?.county ?? shapeName,
                countyCode: county?.code ?? "",
                yieldPerKwp: county?.yieldPerKwp ?? 1150,
              },
            };
          }),
        };

        const map = new maplibre.Map({
          container: containerRef.current,
          center: [24.96, 45.94],
          zoom: 5.45,
          minZoom: 5,
          maxZoom: 13,
          attributionControl: false,
          style: {
            version: 8,
            sources: {
              osm: {
                type: "raster",
                tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                tileSize: 256,
                attribution: "© OpenStreetMap contributors",
              },
            },
            layers: [
              {
                id: "osm",
                type: "raster",
                source: "osm",
                paint: {
                  "raster-saturation": -0.75,
                  "raster-brightness-max": 0.96,
                  "raster-contrast": -0.08,
                },
              },
            ],
          },
        });

        mapRef.current = map;
        map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
        map.addControl(new maplibre.AttributionControl({ compact: true }), "bottom-right");

        const marker = new maplibre.Marker({ color: "#087f5b" })
          .setLngLat([initialValue.lng, initialValue.lat])
          .addTo(map);
        markerRef.current = marker;

        map.on("load", () => {
          map.addSource("romania-counties", { type: "geojson", data: geoJson });
          map.addLayer({
            id: "county-solar-fill",
            type: "fill",
            source: "romania-counties",
            paint: {
              "fill-color": [
                "interpolate",
                ["linear"],
                ["get", "yieldPerKwp"],
                1150,
                "#9ed8b8",
                1250,
                "#52b788",
                1350,
                "#f4b942",
                1420,
                "#f08c2e",
              ],
              "fill-opacity": [
                "case",
                ["==", ["get", "countyCode"], initialValue.countyCode],
                0.72,
                0.42,
              ],
            },
          });
          map.addLayer({
            id: "county-solar-outline",
            type: "line",
            source: "romania-counties",
            paint: {
              "line-color": [
                "case",
                ["==", ["get", "countyCode"], initialValue.countyCode],
                "#102a43",
                "rgba(255,255,255,0.9)",
              ],
              "line-width": [
                "case",
                ["==", ["get", "countyCode"], initialValue.countyCode],
                2.4,
                0.8,
              ],
            },
          });
          setReady(true);
        });

        map.on("mousemove", "county-solar-fill", (event) => {
          map.getCanvas().style.cursor = "crosshair";
          const feature = event.features?.[0];
          if (!feature?.properties) return;
          const county = String(feature.properties.countyName ?? "");
          const annualYield = Number(feature.properties.yieldPerKwp ?? 0);
          map.getCanvas().title = `${county}: aproximativ ${annualYield.toLocaleString("ro-RO")} kWh/kWp/an`;
        });

        map.on("mouseleave", "county-solar-fill", () => {
          map.getCanvas().style.cursor = "";
          map.getCanvas().title = "";
        });

        map.on("click", (event) => {
          const features = map.queryRenderedFeatures(event.point, {
            layers: ["county-solar-fill"],
          });
          const properties = features[0]?.properties;
          const fallback = nearestCounty(event.lngLat.lat, event.lngLat.lng);
          const countyCode = String(properties?.countyCode ?? fallback.code);
          const countyName = String(properties?.countyName ?? fallback.county);
          marker.setLngLat(event.lngLat);
          onCoordinateSelectRef.current(
            createSolarLocation({
              lat: event.lngLat.lat,
              lng: event.lngLat.lng,
              countyCode,
              countyName,
            }),
          );
        });
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "Harta nu a putut fi încărcată.");
        }
      });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    markerRef.current?.setLngLat([value.lng, value.lat]);
    const map = mapRef.current;
    if (!map?.getLayer("county-solar-fill")) return;
    map.easeTo({
      center: [value.lng, value.lat],
      duration: 450,
      essential: true,
    });
    map.setPaintProperty("county-solar-fill", "fill-opacity", [
      "case",
      ["==", ["get", "countyCode"], value.countyCode],
      0.72,
      0.42,
    ]);
    map.setPaintProperty("county-solar-outline", "line-color", [
      "case",
      ["==", ["get", "countyCode"], value.countyCode],
      "#102a43",
      "rgba(255,255,255,0.9)",
    ]);
    map.setPaintProperty("county-solar-outline", "line-width", [
      "case",
      ["==", ["get", "countyCode"], value.countyCode],
      2.4,
      0.8,
    ]);
  }, [value.countyCode, value.lat, value.lng]);

  if (error) {
    return (
      <div className="grid min-h-[320px] place-items-center rounded-[2rem] border border-dashed border-danger/40 bg-danger/5 p-6 text-center md:min-h-[520px] md:p-8">
        <div>
          <p className="font-semibold">Harta nu s-a încărcat.</p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[#edf3ef] shadow-[0_30px_80px_-35px_rgba(16,42,67,.38)]">
      <div ref={containerRef} className="h-[380px] w-full sm:h-[480px] md:h-[650px]" />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-[#edf3ef]">
          <div className="flex items-center gap-3 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-soft">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand-green" />
            Se încarcă harta solară…
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-2xl border border-white/70 bg-white/90 px-3 py-2.5 shadow-soft backdrop-blur sm:bottom-5 sm:left-5 sm:px-4 sm:py-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Locație selectată
        </div>
        <div className="mt-1 truncate font-semibold" data-testid="map-location-label">
          {resolving ? "Se identifică localitatea…" : value.displayLabel}
        </div>
        {resolutionFailed && !resolving && (
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>Afișăm județul.</span>
            {onRetryResolution && (
              <button
                type="button"
                onClick={onRetryResolution}
                className="pointer-events-auto min-h-8 rounded-lg px-2 font-semibold text-brand-green hover:bg-brand-green-soft"
              >
                Reîncearcă
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
