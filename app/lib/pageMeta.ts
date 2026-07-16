interface PageMetaOpts {
  title: string;
  description: string;
  canonical: string; // absolute URL
  image?: string;    // absolute URL; defaults to the static OG image
}

const DEFAULT_IMAGE = "https://slashr.dev/og-image.png";

// Returns the COMPLETE meta descriptor set for a page (title + description +
// robots + og:* + twitter:* + canonical link). RR route meta replaces ancestor
// meta, so every route's meta must return a full set - use this.
export function pageMeta({ title, description, canonical, image = DEFAULT_IMAGE }: PageMetaOpts) {
  return [
    { title },
    { name: "description", content: description },
    { name: "robots", content: "index, follow" },
    { property: "og:type", content: "website" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: canonical },
    { property: "og:image", content: image },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: "@SlashrDev" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
    { tagName: "link", rel: "canonical", href: canonical },
  ];
}
