// Edge request-logging for the NRP observer (slashr.dev side; mirrors nrdax-web's edge-log.ts so both
// properties feed ONE Analytics Engine dataset, `nr_edge_hits`). NRP reads it back host-agnostically —
// slashr.dev is already a recognised surface — so nothing on the NRP side needs to change for slashr.
//
// slashr.dev runs as a React Router SSR Worker (workers/app.ts), so every observed path resolves through
// the Worker. We log ONLY the AI-answer surfaces and embedded badges - never general traffic, and never
// the client IP. Just referer, user-agent, path, host. If a badge or .md mirror later ships as a
// *prerendered static asset*, the asset host would serve it without invoking the Worker; keep those
// surfaces SSR so they stay observable.

/**
 * Paths the NRP edge observer records. Case-insensitive because crawlers and CDNs re-case URLs.
 *  - `/llms.txt`, `/llms-full.txt` - AI answer-engine grounding files
 *  - `*.md`                        - markdown mirror pages
 *  - `/badge/...`                  - SVG badges third parties embed (the strongest non-ask carriage signal)
 */
export const OBSERVED_PATH = /(\/llms(-full)?\.txt$)|(\.md$)|(\/badge\/)/i;

export function isObservedPath(pathname: string): boolean {
  return OBSERVED_PATH.test(pathname);
}

/**
 * The observed paths that are STATIC assets (corpus files in public/), routed through the
 * Worker via `assets.run_worker_first` so they get logged. The SSR handler has no route for
 * them, so the Worker must serve them from the asset store (env.ASSETS.fetch). The badge
 * paths are real SSR routes and are NOT included here.
 */
const STATIC_CORPUS_PATH = /^\/llms(-full)?\.txt$/i;

export function isStaticCorpusPath(pathname: string): boolean {
  return STATIC_CORPUS_PATH.test(pathname);
}

/**
 * One Analytics Engine data point. The four blobs are what NRP's SQL reads as blob1..blob4
 * (referer, user_agent, path, host); `indexes` carries the single allowed index string (the host).
 * No client IP and no other headers are captured - the shape is fixed at four blobs + one index so
 * nothing can leak. Identical layout to nrdax-web/src/lib/edge-log.ts.
 */
export interface EdgeHit {
  blobs: [referer: string, userAgent: string, path: string, host: string];
  indexes: [host: string];
}

export function buildEdgeHit(request: Request, url: URL): EdgeHit {
  return {
    blobs: [
      request.headers.get('referer') ?? '',
      request.headers.get('user-agent') ?? '',
      url.pathname,
      url.hostname,
    ],
    indexes: [url.hostname],
  };
}
