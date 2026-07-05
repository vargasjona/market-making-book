import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/shared";

export default function robots(): MetadataRoute.Robots {
	const baseUrl = getBaseUrl();

	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
				disallow: ["/api/"],
			},
		],
		sitemap: `${baseUrl}/sitemap.xml`,
	};
}
