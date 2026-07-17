import { pageMeta } from "@/lib/pageMeta";

export { default } from "@/pages/AccountPage";

// Auth surface: self-canonical (never point at the homepage) but noindex.
export function meta() {
  return pageMeta({
    title: "Account · slashr",
    description: "Manage your slashr account and API keys.",
    canonical: "https://slashr.dev/account",
    robots: "noindex, follow",
  });
}
