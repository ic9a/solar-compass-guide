import { useEffect, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { normalizeCountyName } from "@/data/countyPotential";

type Props = {
  selectedShapeName?: string;
  onSelect?: (shapeName: string) => void;
  colorFor: (shapeName: string) => string;
  labelFor?: (shapeName: string) => string;
  height?: number;
};

type CountyFeature = Feature<Geometry, { shapeName: string; shapeISO?: string }>;

export function RomaniaMap({
  selectedShapeName,
  onSelect,
  colorFor,
  labelFor,
  height = 460,
}: Props) {
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<{ name: string; x: number; y: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    let cancel = false;
    fetch("/data/romania-counties.geojson")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: FeatureCollection) => { if (!cancel) setGeo(d); })
      .catch((e) => { if (!cancel) setError(e instanceof Error ? e.message : String(e)); });
    return () => { cancel = true; };
  }, []);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(Math.max(280, e.contentRect.width));
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const paths = useMemo(() => {
    if (!geo) return null;
    const projection = geoMercator().fitSize([width, height], geo);
    const path = geoPath(projection);
    return (geo.features as CountyFeature[]).map((f) => {
      const shapeName = normalizeCountyName(f.properties?.shapeName ?? "");
      const centroid = path.centroid(f);
      return { shapeName, d: path(f) ?? "", cx: centroid[0], cy: centroid[1] };
    });
  }, [geo, width, height]);

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed border-[color:var(--danger)]/40 bg-[color-mix(in_oklab,var(--danger)_5%,white)] p-6 text-sm">
        <div className="font-semibold text-[color:var(--danger)]">
          Harta pe județe nu este disponibilă momentan.
        </div>
        <p className="mt-1 text-muted-foreground">
          Lipsește sau nu poate fi încărcat fișierul GeoJSON cu județele
          României. Poți folosi în continuare lista de mai jos.
        </p>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      {!paths ? (
        <div
          className="w-full rounded-xl bg-muted/50 animate-pulse"
          style={{ height }}
        />
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={height}
          role="img"
          aria-label="Harta județelor României colorată după potențialul solar"
          className="block"
        >
          {paths.map((p) => {
            const selected = selectedShapeName === p.shapeName;
            return (
              <path
                key={p.shapeName}
                d={p.d}
                fill={colorFor(p.shapeName)}
                stroke={selected ? "var(--brand-ink)" : "rgba(255,255,255,0.9)"}
                strokeWidth={selected ? 2 : 0.7}
                className="cursor-pointer transition-[filter,stroke-width] hover:brightness-110 focus:outline-none"
                onClick={() => onSelect?.(p.shapeName)}
                onMouseMove={(e) => {
                  const rect = wrapRef.current!.getBoundingClientRect();
                  setHover({
                    name: p.shapeName,
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                }}
                onMouseLeave={() => setHover(null)}
              >
                <title>{labelFor ? labelFor(p.shapeName) : p.shapeName}</title>
              </path>
            );
          })}
        </svg>
      )}
      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-border/70 bg-card px-2.5 py-1.5 text-xs shadow-lift"
          style={{ left: hover.x + 12, top: hover.y + 12, maxWidth: 220 }}
        >
          {labelFor ? labelFor(hover.name) : hover.name}
        </div>
      )}
    </div>
  );
}
