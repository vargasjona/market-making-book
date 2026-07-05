export const appName = "The Market Making Book";
export const appDescription =
	"A free practitioner's manual on market making: order books, the mathematics of optimal quoting, six real venues, an algorithm catalog, and a hands-on crypto practicum.";
export const docsRoute = "/docs";

/**
 * Canonical site origin for metadata, sitemap, and robots. Set
 * NEXT_PUBLIC_SITE_URL in production (e.g. https://your-domain.com);
 * falls back to the Vercel production URL, then localhost in dev.
 */
export function getBaseUrl(): string {
	if (process.env.NEXT_PUBLIC_SITE_URL) {
		return process.env.NEXT_PUBLIC_SITE_URL;
	}
	if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
		return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
	}
	return "http://localhost:4000";
}
export const docsImageRoute = "/og/docs";
export const docsContentRoute = "/llms.mdx/docs";

export const gitConfig = {
	user: "allient",
	repo: "get-rich-slow-bun",
	branch: "main",
};
