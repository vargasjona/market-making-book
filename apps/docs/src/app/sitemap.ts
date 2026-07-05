import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/shared";
import { source } from "@/lib/source";

export const revalidate = false;

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = getBaseUrl();

	return [
		{
			url: baseUrl,
			changeFrequency: "weekly",
			priority: 1,
		},
		...source.getPages().map((page) => ({
			url: new URL(page.url, baseUrl).toString(),
			changeFrequency: "weekly" as const,
			priority: 0.8,
		})),
	];
}
