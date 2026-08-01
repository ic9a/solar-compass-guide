import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { SEO_LAST_MODIFIED, SITE_URL, indexablePaths } from "@/lib/seo-content";

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  })[character] ?? character);
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls = indexablePaths.map((path) =>
          `  <url><loc>${escapeXml(`${SITE_URL}${path}`)}</loc><lastmod>${SEO_LAST_MODIFIED}</lastmod><changefreq>${path === "/" ? "weekly" : "monthly"}</changefreq></url>`,
        ).join("\n");
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`,
          { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } },
        );
      },
    },
  },
});
