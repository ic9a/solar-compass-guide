import type { Orientation } from "@/lib/recommendation-v2/types";

type IllustratedOrientation = Orientation | "unknown";

const arrows: Record<Exclude<IllustratedOrientation, "east-west" | "unknown">, string> = {
  south: "M60 37V65m0 0-6-8m6 8 6-8",
  "south-east": "M60 37 84 59m0 0-10-2m10 2-2-10",
  "south-west": "M60 37 36 59m0 0 10-2m-10 2 2-10",
  east: "M60 37h34m0 0-9-6m9 6-9 6",
  west: "M60 37H26m0 0 9-6m-9 6 9 6",
  north: "M60 37V10m0 0-6 8m6-8 6 8",
};

export function RoofOrientationIllustration({
  orientation,
  selected = false,
}: {
  orientation: IllustratedOrientation;
  selected?: boolean;
}) {
  const dual = orientation === "east-west";
  const unknown = orientation === "unknown";
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 120 76"
      data-roof-orientation={orientation}
      data-selected={selected ? "true" : "false"}
      className="h-20 w-full max-w-[10rem] overflow-visible"
    >
      <path d="M60 4v10" stroke="currentColor" strokeWidth="2" />
      <text x="60" y="9" textAnchor="middle" fontSize="8" fontWeight="700" fill="currentColor">N</text>
      <path d="M16 37 60 17l44 20-44 20Z" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M60 17v40" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
      {dual ? (
        <>
          <path data-plane="east" d="M18 37 58 20v34Z" fill="currentColor" opacity={selected ? 0.72 : 0.42} stroke="currentColor" strokeWidth="2" />
          <path data-plane="west" d="M62 20 102 37 62 54Z" fill="currentColor" opacity={selected ? 0.72 : 0.42} stroke="currentColor" strokeWidth="2" />
          <path d="M46 37H25m0 0 7-5m-7 5 7 5M74 37h21m0 0-7-5m7 5-7 5" fill="none" stroke="white" strokeWidth="2.5" />
        </>
      ) : unknown ? (
        <>
          <circle cx="60" cy="37" r="13" fill="white" stroke="currentColor" strokeWidth="2.5" />
          <text x="60" y="43" textAnchor="middle" fontSize="18" fontWeight="800" fill="currentColor">?</text>
        </>
      ) : (
        <>
          <path data-plane="single" d="M20 37 60 20l40 17-40 17Z" fill="currentColor" opacity={selected ? 0.34 : 0.18} />
          <path d={arrows[orientation]} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}
