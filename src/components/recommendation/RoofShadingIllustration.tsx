import type { Shading } from "@/lib/recommendation-v2/types";

type IllustratedShading = Shading | "unknown";

const shadowWidth: Record<Exclude<IllustratedShading, "unknown">, number> = {
  none: 0,
  light: 18,
  moderate: 42,
  severe: 74,
};

export function RoofShadingIllustration({
  shading,
  selected = false,
}: {
  shading: IllustratedShading;
  selected?: boolean;
}) {
  const unknown = shading === "unknown";
  const width = unknown ? 0 : shadowWidth[shading];
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 120 76"
      data-roof-shading={shading}
      data-selected={selected ? "true" : "false"}
      className="h-20 w-full max-w-[10rem] overflow-visible"
    >
      <circle cx="96" cy="14" r="8" fill="none" stroke="currentColor" strokeWidth="2.5" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <path key={angle} d="M96 1v5" stroke="currentColor" strokeWidth="2" transform={`rotate(${angle} 96 14)`} />
      ))}
      <path d="M16 58 33 25h54l17 33Z" fill="white" stroke="currentColor" strokeWidth="2.5" />
      {[42, 56, 70].map((x) => <path key={x} d={`M${x} 29v25`} stroke="currentColor" opacity="0.35" />)}
      <path d="M27 40h68M22 50h77" stroke="currentColor" opacity="0.35" />
      {shading === "none" && (
        <path data-sunlight="full" d="M88 20 76 30m8-15L69 29m29-6L83 34" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
      )}
      {width > 0 && (
        <path
          data-shadow={shading}
          d={`M16 58 33 25h${width}l17 33Z`}
          fill="currentColor"
          opacity={selected ? 0.62 : 0.42}
        />
      )}
      {(shading === "moderate" || shading === "severe") && (
        <g data-obstruction={shading} transform={shading === "severe" ? "translate(5 -3) scale(1.2)" : undefined}>
          <path d="M18 47V25" stroke="currentColor" strokeWidth="4" />
          <circle cx="18" cy="21" r="11" fill="white" stroke="currentColor" strokeWidth="2.5" />
        </g>
      )}
      {unknown && (
        <g data-question="true">
          <circle cx="60" cy="42" r="14" fill="white" stroke="currentColor" strokeWidth="2.5" />
          <text x="60" y="48" textAnchor="middle" fontSize="18" fontWeight="800" fill="currentColor">?</text>
        </g>
      )}
    </svg>
  );
}
