// Cloudflare Pages middleware — injects route-specific meta tags for bot
// user agents (social preview crawlers, search engines). Normal users
// get the unchanged SPA.

interface Env {
  API_ORIGIN: string;
  CF_ACCESS_CLIENT_ID: string;
  CF_ACCESS_CLIENT_SECRET: string;
}

const BOT_UA = /Twitterbot|facebookexternalhit|Googlebot|Discordbot|Slackbot|LinkedInBot|Bingbot|Applebot|bot|crawl|spider/i;
const SKIP_PATH = /^\/(api|assets)\//;
const HAS_EXT = /\.\w{2,5}$/;

const NETWORK_NAMES: Record<string, string> = {
  solana: 'Solana',
  ethereum: 'Ethereum',
  cosmos: 'Cosmos Hub',
  sui: 'Sui',
  polkadot: 'Polkadot',
};

interface ValidatorData {
  address: string;
  moniker: string | null;
  network: string;
  first_seen: string;
  last_seen: string;
  events: { id: number }[];
}

interface ReportData {
  provider_name: string;
}

// --- Helpers ---

function truncateAddress(addr: string): string {
  if (addr.length <= 16) return addr;
  return addr.slice(0, 8) + '...' + addr.slice(-4);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function fetchValidatorData(
  env: Env,
  network: string,
  address: string,
): Promise<ValidatorData | null> {
  try {
    const url = `${env.API_ORIGIN}/v1/validators/${encodeURIComponent(network)}/${encodeURIComponent(address)}`;
    const res = await fetch(url, {
      headers: {
        'CF-Access-Client-Id': env.CF_ACCESS_CLIENT_ID,
        'CF-Access-Client-Secret': env.CF_ACCESS_CLIENT_SECRET,
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: ValidatorData };
    return json.data;
  } catch {
    return null;
  }
}

async function fetchReportData(
  env: Env,
  providerSlug: string,
): Promise<ReportData | null> {
  try {
    const url = `${env.API_ORIGIN}/v1/reports/${encodeURIComponent(providerSlug)}`;
    const res = await fetch(url, {
      headers: {
        'CF-Access-Client-Id': env.CF_ACCESS_CLIENT_ID,
        'CF-Access-Client-Secret': env.CF_ACCESS_CLIENT_SECRET,
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: { provider_name: string } };
    return json.data;
  } catch {
    return null;
  }
}

// --- Route-specific meta ---

interface HeadMeta {
  title: string;
  description: string;
  url: string;
}

function getHeadMeta(
  pathname: string,
  validator: ValidatorData | null,
  report: ReportData | null,
): HeadMeta {
  const base = 'https://slashr.dev';

  // /validator/:network/:address
  const validatorMatch = pathname.match(/^\/validator\/([^/]+)\/([^/]+)\/?$/);
  if (validatorMatch && validator) {
    const network = validatorMatch[1]!;
    const networkName = NETWORK_NAMES[network] ?? network;
    const name = validator.moniker?.trim() || truncateAddress(validator.address);
    const count = validator.events.length;

    return {
      title: `${name} \u00b7 ${networkName} \u00b7 slashr`,
      description: `${count} incident${count === 1 ? '' : 's'} recorded on slashr.`,
      url: `${base}${pathname}`,
    };
  }

  // /validators
  if (pathname === '/validators' || pathname === '/validators/') {
    return {
      title: 'Tracked Validators \u00b7 slashr',
      description:
        'All validators with recorded incidents across Solana, Ethereum, Sui, and Cosmos.',
      url: `${base}/validators`,
    };
  }

  // /rankings
  if (pathname === '/rankings' || pathname === '/rankings/') {
    return {
      title: 'Validator Rankings \u00b7 slashr',
      description:
        'Worst offenders and most reliable validators across Solana, Ethereum, Sui, and Cosmos.',
      url: `${base}/rankings`,
    };
  }

  // /check
  if (pathname === '/check' || pathname === '/check/') {
    return {
      title: 'Check Your Validators \u00b7 slashr',
      description:
        "Paste your wallet address. See your validators' incident history.",
      url: `${base}/check`,
    };
  }

  // /reports/:slug
  const reportMatch = pathname.match(/^\/reports\/([^/]+)\/?$/);
  if (reportMatch) {
    if (report) {
      return {
        title: `${report.provider_name} Reliability Report \u00b7 slashr`,
        description: `Cross-chain reliability summary for ${report.provider_name}.`,
        url: `${base}${pathname}`,
      };
    }
    return {
      title: 'Reliability Report \u00b7 slashr',
      description: 'Validator reliability report on slashr.',
      url: `${base}${pathname}`,
    };
  }

  // /reports
  if (pathname === '/reports' || pathname === '/reports/') {
    return {
      title: 'Reliability Reports \u00b7 slashr',
      description:
        'Monthly validator reliability reports by staking provider.',
      url: `${base}/reports`,
    };
  }

  // / (default)
  return {
    title: 'slashr \u2014 live validator incident feed',
    description:
      'Real-time slashing, delinquency, and missed vote tracking across Solana, Ethereum, Sui, and Cosmos.',
    url: base,
  };
}

function injectMeta(html: string, meta: HeadMeta): string {
  const t = escapeHtml(meta.title);
  const d = escapeHtml(meta.description);
  const u = escapeHtml(meta.url);

  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${d}" />`,
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
      `<meta property="og:title" content="${t}" />`,
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
      `<meta property="og:description" content="${d}" />`,
    )
    .replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/,
      `<meta property="og:url" content="${u}" />`,
    )
    .replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/,
      `<meta name="twitter:title" content="${t}" />`,
    )
    .replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/,
      `<meta name="twitter:description" content="${d}" />`,
    )
    .replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
      `<link rel="canonical" href="${u}" />`,
    )
    .replace(
      /"url":\s*"[^"]*"/,
      `"url": "${meta.url}"`,
    );
}

// --- Middleware entry ---

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Skip non-page routes
  if (SKIP_PATH.test(pathname) || HAS_EXT.test(pathname)) {
    return context.next();
  }

  // Skip non-bot requests
  const ua = request.headers.get('User-Agent') || '';
  if (!BOT_UA.test(ua)) {
    return context.next();
  }

  // Get the static HTML from Pages
  const response = await context.next();
  const html = await response.text();

  // Fetch data for dynamic pages
  let validator: ValidatorData | null = null;
  const validatorMatch = pathname.match(/^\/validator\/([^/]+)\/([^/]+)\/?$/);
  if (validatorMatch) {
    validator = await fetchValidatorData(
      context.env,
      validatorMatch[1]!,
      validatorMatch[2]!,
    );
  }

  let report: ReportData | null = null;
  const reportMatch = pathname.match(/^\/reports\/([^/]+)\/?$/);
  if (reportMatch) {
    report = await fetchReportData(context.env, reportMatch[1]!);
  }

  // Generate and inject meta tags
  const meta = getHeadMeta(pathname, validator, report);
  const enrichedHtml = injectMeta(html, meta);

  return new Response(enrichedHtml, {
    status: response.status,
    headers: response.headers,
  });
};
