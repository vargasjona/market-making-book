import { appDescription, appName, docsRoute, getBaseUrl } from "./shared";
import { getPageImage, type source } from "./source";

type Page = (typeof source)["$inferPage"];

/**
 * Serialize a schema.org object for a <script type="application/ld+json">
 * tag, escaping "<" so content can never close the script element.
 */
export function serializeJsonLd(data: object): string {
	return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function bookJsonLd() {
	return {
		"@context": "https://schema.org",
		"@type": "Book",
		name: appName,
		description: appDescription,
		url: getBaseUrl(),
		bookFormat: "https://schema.org/EBook",
		isAccessibleForFree: true,
		inLanguage: "en",
	};
}

export function techArticleJsonLd(page: Page) {
	const baseUrl = getBaseUrl();

	return {
		"@context": "https://schema.org",
		"@type": "TechArticle",
		headline: page.data.title,
		description: page.data.description,
		url: new URL(page.url, baseUrl).toString(),
		image: new URL(getPageImage(page).url, baseUrl).toString(),
		inLanguage: "en",
		isPartOf: {
			"@type": "Book",
			name: appName,
			url: baseUrl,
		},
	};
}

export function breadcrumbJsonLd(page: Page) {
	const baseUrl = getBaseUrl();

	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: [
			{
				"@type": "ListItem",
				position: 1,
				name: appName,
				item: baseUrl,
			},
			{
				"@type": "ListItem",
				position: 2,
				name: "Book",
				item: new URL(docsRoute, baseUrl).toString(),
			},
			{
				"@type": "ListItem",
				position: 3,
				name: page.data.title,
				item: new URL(page.url, baseUrl).toString(),
			},
		],
	};
}
