// GET /sitemap.xml — generated from validator + report data.
// Ported from the Pages Function functions/sitemap.xml.ts. Fetches the PUBLIC
// prod API (zero secrets). Degrades to static-pages-only on any failure.

const BASE = "https://slashr.dev";
const UPSTREAM = "https://slashr.dev/api";

interface Validator {
  network: string;
  address: string;
  last_event_at: string | null;
}
interface ReportProvider {
  provider_slug: string;
}

const STATIC_PAGES: { path: string; priority: string; changefreq: string }[] = [
  { path: "/", priority: "1.0", changefreq: "hourly" },
  { path: "/risk", priority: "0.9", changefreq: "hourly" },
  { path: "/feed", priority: "0.9", changefreq: "hourly" },
  { path: "/validators", priority: "0.8", changefreq: "daily" },
  { path: "/rankings", priority: "0.8", changefreq: "daily" },
  { path: "/insights", priority: "0.7", changefreq: "daily" },
  { path: "/reports", priority: "0.7", changefreq: "daily" },
  { path: "/reports/providers", priority: "0.6", changefreq: "daily" },
  { path: "/check", priority: "0.5", changefreq: "monthly" },
  { path: "/developers", priority: "0.5", changefreq: "monthly" },
];

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function fetchAllValidators(): Promise<Validator[]> {
  const all: Validator[] = [];
  let cursor: string | null = null;
  for (let i = 0; i < 40; i++) {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    const res = await fetch(`${UPSTREAM}/v1/validators?${params}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.error(`sitemap: validators fetch failed: ${res.status}`);
      break;
    }
    const json = (await res.json()) as {
      data: Validator[];
      pagination?: { has_more: boolean; next_cursor: string | null };
    };
    all.push(...json.data);
    if (!json.pagination?.has_more || !json.pagination.next_cursor) break;
    cursor = json.pagination.next_cursor;
  }
  return all;
}

async function fetchAllReports(): Promise<ReportProvider[]> {
  const all: ReportProvider[] = [];
  for (let page = 1; page <= 20; page++) {
    const params = new URLSearchParams({ per_page: "200", page: String(page) });
    const res = await fetch(`${UPSTREAM}/v1/reports?${params}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.error(`sitemap: reports fetch failed: ${res.status}`);
      break;
    }
    const json = (await res.json()) as { data: ReportProvider[]; total?: number };
    all.push(...json.data);
    if (!json.total || all.length >= json.total) break;
  }
  return all;
}

function buildSitemap(validators: Validator[], reports: ReportProvider[]): string {
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  const freshest = validators.reduce<string>((max, v) => {
    const d = v.last_event_at ? v.last_event_at.slice(0, 10) : "";
    return d > max ? d : max;
  }, "");

  for (const p of STATIC_PAGES) {
    lines.push(`  <url>`, `    <loc>${BASE}${p.path}</loc>`);
    if (freshest) lines.push(`    <lastmod>${freshest}</lastmod>`);
    lines.push(
      `    <changefreq>${p.changefreq}</changefreq>`,
      `    <priority>${p.priority}</priority>`,
      `  </url>`,
    );
  }

  for (const v of validators) {
    const loc = `${BASE}/validator/${escapeXml(v.network)}/${escapeXml(v.address)}`;
    const lastmod = v.last_event_at ? v.last_event_at.slice(0, 10) : "";
    lines.push(`  <url>`, `    <loc>${loc}</loc>`);
    if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
    lines.push(`    <changefreq>daily</changefreq>`, `    <priority>0.6</priority>`, `  </url>`);
  }

  for (const r of reports) {
    lines.push(
      `  <url>`,
      `    <loc>${BASE}/reports/${escapeXml(r.provider_slug)}</loc>`,
      `    <changefreq>weekly</changefreq>`,
      `    <priority>0.5</priority>`,
      `  </url>`,
    );
  }

  lines.push("</urlset>");
  return lines.join("\n");
}

export async function loader() {
  let xml: string;
  try {
    const [validators, reports] = await Promise.all([
      fetchAllValidators(),
      fetchAllReports(),
    ]);
    console.log(`sitemap: ${validators.length} validators, ${reports.length} reports`);
    xml = buildSitemap(validators, reports);
  } catch (err) {
    console.error("sitemap generation failed, serving static-only:", String(err));
    xml = buildSitemap([], []);
  }
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
