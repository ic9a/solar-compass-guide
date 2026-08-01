import { Link } from "@tanstack/react-router";

export function Logo({
  className = "",
  size = "md",
  onDark = false,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  onDark?: boolean;
}) {
  const sizes = {
    sm: { base: "text-base", ro: "text-[0.6em]" },
    md: { base: "text-xl", ro: "text-[0.55em]" },
    lg: { base: "text-3xl md:text-4xl", ro: "text-[0.5em]" },
  }[size];

  return (
    <Link to="/" className={`inline-flex items-baseline font-extrabold tracking-tight ${sizes.base} ${className}`}>
      <span style={{ color: onDark ? "#7ee0aa" : "var(--brand-green)" }}>raport</span>
      <span style={{ color: onDark ? "#ffc66d" : "#a85f00" }}>solar</span>
      <span className={`${sizes.ro} ml-0.5 font-semibold ${onDark ? "text-white/80" : "text-foreground/65"}`}>
        .ro
      </span>
    </Link>
  );
}
