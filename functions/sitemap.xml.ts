// Cloudflare Pages Function — generates sitemap.xml by fetching validator
// and report data from the API. Cached at the edge for 1 hour.

interface Env {
  API_ORIGIN: string;
  CF_ACCESS_CLIENT_ID: string;
  CF_ACCESS_CLIENT_SECRET: string;
}

interface Validator {
  network: string;
  address: string;
  last_event_at: string | null;
}

interface ReportProvider {
  provider_slug: string;
}

const BASE = 'https://slashr.dev';

const STATIC_PAGES: { path: string; priority: string; changefreq: string }[] = [
  { path: '/', priority: '1.0', changefreq: 'hourly' },
  { path: '/validators', priority: '0.8', changefreq: 'daily' },
  { path: '/rankings', priority: '0.8', changefreq: 'daily' },
  { path: '/insights', priority: '0.7', changefreq: 'daily' },
  { path: '/reports', priority: '0.7', changefreq: 'daily' },
  { path: '/check', priority: '0.5', changefreq: 'monthly' },
  { path: '/developers', priority: '0.4', changefreq: 'monthly' },
  { path: '/alerts', priority: '0.4', changefreq: 'monthly' },
];

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function apiHeaders(env: Env): Headers {
  const h = new Headers();
  h.set('CF-Access-Client-Id', env.CF_ACCESS_CLIENT_ID);
  h.set('CF-Access-Client-Secret', env.CF_ACCESS_CLIENT_SECRET);
  h.set('Accept', 'application/json');
  return h;
}

async function fetchAllValidators(env: Env): Promise<Validator[]> {
  const all: Validator[] = [];
  let cursor: string | null = null;
  const headers = apiHeaders(env);

  for (let i = 0; i < 100; i++) {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    const url = `${env.API_ORIGIN}/v1/validators?${params}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.error(`sitemap: validators fetch failed: ${res.status} ${res.statusText} (${url})`);
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

async function fetchAllReports(env: Env): Promise<ReportProvider[]> {
  const all: ReportProvider[] = [];
  const headers = apiHeaders(env);

  for (let page = 1; page <= 50; page++) {
    const params = new URLSearchParams({ per_page: '200', page: String(page) });
    const url = `${env.API_ORIGIN}/v1/reports?${params}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.error(`sitemap: reports fetch failed: ${res.status} ${res.statusText} (${url})`);
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

  // Static pages
  for (const p of STATIC_PAGES) {
    lines.push(
      `  <url>`,
      `    <loc>${BASE}${p.path}</loc>`,
      `    <changefreq>${p.changefreq}</changefreq>`,
      `    <priority>${p.priority}</priority>`,
      `  </url>`,
    );
  }

  // Validator pages
  for (const v of validators) {
    const loc = `${BASE}/validator/${escapeXml(v.network)}/${escapeXml(v.address)}`;
    const lastmod = v.last_event_at ? v.last_event_at.slice(0, 10) : '';
    lines.push(`  <url>`);
    lines.push(`    <loc>${loc}</loc>`);
    if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
    lines.push(`    <changefreq>daily</changefreq>`);
    lines.push(`    <priority>0.6</priority>`);
    lines.push(`  </url>`);
  }

  // Report pages
  for (const r of reports) {
    lines.push(
      `  <url>`,
      `    <loc>${BASE}/reports/${escapeXml(r.provider_slug)}</loc>`,
      `    <changefreq>weekly</changefreq>`,
      `    <priority>0.5</priority>`,
      `  </url>`,
    );
  }

  lines.push('</urlset>');
  return lines.join('\n');
}

function staticOnlySitemap(): string {
  return buildSitemap([], []);
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;

  let xml: string;
  try {
    const [validators, reports] = await Promise.all([
      fetchAllValidators(env),
      fetchAllReports(env),
    ]);
    console.log(`sitemap: ${validators.length} validators, ${reports.length} reports`);
    xml = buildSitemap(validators, reports);
  } catch (err) {
    console.error('sitemap generation failed, serving static-only:', String(err));
    xml = staticOnlySitemap();
  }

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
