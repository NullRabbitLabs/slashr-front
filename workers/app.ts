import { createRequestHandler } from "react-router";

import { buildEdgeHit, isObservedPath, isStaticCorpusPath } from "./edge-log";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env) {
    // NRP edge observer: log ONLY the AI-answer surfaces and embedded badges to Analytics Engine
    // (referer/user-agent/path/host — no client IP). Fire-and-forget; a no-op if NR_AE is unbound, so it
    // can never affect a response. Same dataset (nr_edge_hits) as nrdax-web, so NRP ingests both uniformly.
    const url = new URL(request.url);
    if (isObservedPath(url.pathname)) {
      env.NR_AE?.writeDataPoint(buildEdgeHit(request, url));
    }
    // Static corpus files (llms.txt / llms-full.txt) are routed here by run_worker_first purely
    // so they get logged; the SSR handler has no route for them, so serve them from the asset
    // store. Everything else (SSR routes, including badges) goes to the React Router handler.
    if (isStaticCorpusPath(url.pathname)) {
      return env.ASSETS.fetch(request);
    }
    return requestHandler(request);
  },
} satisfies ExportedHandler<Env>;
