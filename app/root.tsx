import type { ReactNode } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";

// Self-hosted fonts (were imported in the SPA's main.tsx).
import "@fontsource/geist-sans/latin-300.css";
import "@fontsource/geist-sans/latin-400.css";
import "@fontsource/geist-sans/latin-500.css";
import "@fontsource/geist-sans/latin-600.css";
import "@fontsource/geist-sans/latin-700.css";
import "@fontsource/geist-mono/latin-400.css";
import "@fontsource/geist-mono/latin-500.css";
import "@fontsource/space-grotesk/latin-700.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-600.css";
import "./styles/global.css";

import { AuthProvider } from "@/hooks/useAuth";
import { Layout as AppShell } from "@/components/Layout";
import { useStats } from "@/hooks/useStats";
import { pageMeta } from "@/lib/pageMeta";

// Stamp data-theme before first paint so a stored/OS dark preference doesn't
// flash the light surface (FOUC). useTheme seeds its state from this attribute.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('slashr-theme');if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();`;

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://slashr.dev/#organization",
      name: "Slashr",
      url: "https://slashr.dev",
      logo: "https://slashr.dev/nullrabbit.png",
      description:
        "Multi-chain validator risk intelligence: slashing, downtime, and commission monitoring across Solana, Ethereum, Sui, and Cosmos.",
      parentOrganization: {
        "@type": "Organization",
        name: "NullRabbit",
        url: "https://nullrabbit.ai",
      },
      sameAs: [
        "https://x.com/SlashrDev",
        "https://t.me/SlashrDevBot",
        "https://nullrabbit.ai",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://slashr.dev/#website",
      name: "Slashr",
      url: "https://slashr.dev",
      description:
        "Live validator incident feed and the Slashr Risk Index across Solana, Ethereum, Sui, and Cosmos.",
      publisher: { "@id": "https://slashr.dev/#organization" },
    },
    {
      "@type": "SoftwareApplication",
      name: "Slashr",
      applicationCategory: "SecurityApplication",
      operatingSystem: "Web",
      url: "https://slashr.dev",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@id": "https://slashr.dev/#organization" },
    },
  ],
};

export const links: Route.LinksFunction = () => [
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  {
    rel: "alternate",
    type: "application/rss+xml",
    title: "Slashr · validator incidents",
    href: "https://slashr.dev/feed/incidents.rss",
  },
  {
    rel: "alternate",
    type: "application/feed+json",
    title: "Slashr · validator incidents",
    href: "https://slashr.dev/feed/incidents.json",
  },
];

// Default (homepage) meta. Individual routes override title/description/canonical
// via their own `meta` export.
export const meta: Route.MetaFunction = () =>
  pageMeta({
    title: "slashr · live validator incident feed",
    description:
      "Real-time slashing, delinquency, and missed vote tracking across Solana, Ethereum, Sui, and Cosmos.",
    canonical: "https://slashr.dev",
  });

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  // Shell counters (stats) load client-side; the shell renders placeholders
  // during SSR. Route content is server-rendered by each route's loader.
  const { stats } = useStats();
  return (
    <AuthProvider>
      <AppShell stats={stats}>
        <Outlet />
      </AppShell>
    </AuthProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main style={{ padding: "4rem 1rem", maxWidth: 720, margin: "0 auto" }}>
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre style={{ width: "100%", padding: "1rem", overflowX: "auto" }}>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
