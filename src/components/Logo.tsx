import { Link } from "@tanstack/react-router";

export function Logo({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  onDark?: boolean;
}) {
  const sizes = {
    sm: "h-7 w-auto",
    md: "h-8 w-auto lg:h-9",
    lg: "h-10 w-auto md:h-12",
  }[size];

  return (
    <Link
      to="/"
      aria-label="raportsolar.ro — pagina principală"
      className={`inline-flex shrink-0 items-center focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sun ${className}`}
    >
      <img
        src="/brand/raportsolar-wordmark.png"
        width={720}
        height={154}
        alt="raportsolar.ro"
        className={sizes}
      />
    </Link>
  );
}
