import { pageMeta } from "@/lib/pageMeta";

export { default } from "@/pages/LoginPage";

// Auth surface: self-canonical (never point at the homepage) but noindex.
export function meta() {
  return pageMeta({
    title: "Log in · slashr",
    description: "Sign in to slashr to manage API keys and alerts.",
    canonical: "https://slashr.dev/login",
    robots: "noindex, follow",
  });
}
