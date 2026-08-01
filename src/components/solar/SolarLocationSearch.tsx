import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LoaderCircle, MapPin, Search, X } from "lucide-react";
import { searchSolarLocations, type LocationSearchResult } from "@/lib/geocoding.functions";
import type { SolarLocation } from "@/lib/solarLocation";

type Props = {
  value?: SolarLocation;
  onSelect: (location: SolarLocation) => void;
  onClear?: () => void;
  onOpenChange?: (open: boolean) => void;
};

type PanelPosition = { left: number; top: number; width: number; maxHeight: number };

export function SolarLocationSearch({ value, onSelect, onClear, onOpenChange }: Props) {
  const listboxId = useId();
  const requestId = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "empty" | "error">("idle");
  const [panelPosition, setPanelPosition] = useState<PanelPosition>();

  useEffect(() => {
    setQuery(value?.displayLabel ?? "");
    requestId.current += 1;
    setResults([]);
    setActiveIndex(-1);
    setStatus("idle");
  }, [value?.displayLabel]);

  const isOpen = status !== "idle";

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === value?.displayLabel || trimmed.length < 3) {
      requestId.current += 1;
      setResults([]);
      setActiveIndex(-1);
      setStatus("idle");
      return;
    }
    const currentRequest = ++requestId.current;
    const timer = window.setTimeout(() => {
      setStatus("loading");
      searchSolarLocations({ data: { query: trimmed } })
        .then((nextResults) => {
          if (currentRequest !== requestId.current) return;
          setResults(nextResults);
          setActiveIndex(nextResults.length ? 0 : -1);
          setStatus(nextResults.length ? "ready" : "empty");
        })
        .catch(() => {
          if (currentRequest !== requestId.current) return;
          setResults([]);
          setActiveIndex(-1);
          setStatus("error");
        });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query, value?.displayLabel]);

  useEffect(() => {
    if (!isOpen) return;
    const updatePosition = () => {
      const input = inputRef.current;
      if (!input) return;
      const rect = input.getBoundingClientRect();
      const viewport = window.visualViewport;
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const safeBottom = 16;
      const below = viewportTop + viewportHeight - rect.bottom - safeBottom;
      const above = rect.top - viewportTop - safeBottom;
      const openAbove = below < 220 && above > below;
      const maxHeight = Math.max(140, Math.min(288, (openAbove ? above : below) - 10));
      setPanelPosition({
        left: Math.max(8, rect.left),
        top: openAbove ? Math.max(viewportTop + 8, rect.top - maxHeight - 8) : rect.bottom + 8,
        width: Math.min(rect.width, window.innerWidth - Math.max(8, rect.left) - 8),
        maxHeight,
      });
    };
    updatePosition();
    const viewport = window.visualViewport;
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    viewport?.addEventListener("resize", updatePosition);
    viewport?.addEventListener("scroll", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      viewport?.removeEventListener("resize", updatePosition);
      viewport?.removeEventListener("scroll", updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      requestId.current += 1;
      setResults([]);
      setStatus("idle");
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [isOpen]);

  const close = () => {
    requestId.current += 1;
    setResults([]);
    setActiveIndex(-1);
    setStatus("idle");
  };

  const choose = (result: LocationSearchResult) => {
    onSelect(result);
    setQuery(result.displayLabel);
    close();
  };

  const panel =
    isOpen && panelPosition && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={panelRef}
            id={listboxId}
            role="listbox"
            aria-label="Rezultate localități"
            className="fixed z-[100] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-white p-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lift"
            style={panelPosition}
          >
            {status === "loading" && <p className="px-3 py-3 text-sm text-muted-foreground">Se caută localitatea…</p>}
            {status === "empty" && <p className="px-3 py-3 text-sm text-muted-foreground">Nu am găsit o localitate cu acest nume. Încearcă și județul.</p>}
            {status === "error" && <p className="px-3 py-3 text-sm text-muted-foreground">Căutarea nu este disponibilă momentan. Poți folosi județul.</p>}
            {results.map((result, index) => (
              <button
                key={result.id}
                id={`${listboxId}-option-${index}`}
                type="button"
                role="option"
                aria-selected={activeIndex === index}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(result)}
                className={`flex min-h-12 w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${activeIndex === index ? "bg-brand-green-soft" : "hover:bg-muted"}`}
              >
                <MapPin className="h-4 w-4 shrink-0 text-brand-green" aria-hidden="true" />
                <span className="min-w-0 truncate font-medium">{result.displayLabel}</span>
              </button>
            ))}
            {results.length > 0 && <p className="px-3 pb-1 pt-2 text-[10px] text-muted-foreground">Date de localizare © OpenStreetMap contributors · Photon</p>}
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={`${listboxId}-input`} className="form-label">Caută localitatea</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          ref={inputRef}
          id={`${listboxId}-input`}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              close();
              return;
            }
            if (!results.length) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) => (index + 1) % results.length);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
            } else if (event.key === "Enter" && activeIndex >= 0) {
              event.preventDefault();
              choose(results[activeIndex]);
            }
          }}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 && results[activeIndex] ? `${listboxId}-option-${activeIndex}` : undefined}
          placeholder="Ex.: Brașov"
          autoComplete="off"
          className="min-h-12 w-full rounded-xl border border-border bg-white py-3 pl-10 pr-10 text-base outline-none sm:text-sm"
        />
        {status === "loading" ? (
          <LoaderCircle className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand-green" aria-label="Se caută" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              close();
              onClear?.();
              inputRef.current?.focus();
            }}
            className="absolute right-1.5 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-lg hover:bg-muted"
            aria-label="Șterge căutarea"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {panel}
    </div>
  );
}
