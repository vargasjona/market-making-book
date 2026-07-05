import {
	DocsBody,
	DocsDescription,
	DocsPage,
	DocsTitle,
	MarkdownCopyButton,
	ViewOptionsPopover,
} from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/components/mdx";
import {
	breadcrumbJsonLd,
	serializeJsonLd,
	techArticleJsonLd,
} from "@/lib/json-ld";
import { gitConfig } from "@/lib/shared";
import { getPageImage, getPageMarkdownUrl, source } from "@/lib/source";

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
	const params = await props.params;
	const page = source.getPage(params.slug);
	if (!page) {
		notFound();
	}

	const MDX = page.data.body;
	const markdownUrl = getPageMarkdownUrl(page).url;

	const jsonLd = serializeJsonLd([
		techArticleJsonLd(page),
		breadcrumbJsonLd(page),
	]);

	return (
		<DocsPage full={page.data.full} toc={page.data.toc}>
			<script
				// biome-ignore lint/security/noDangerouslySetInnerHtml: schema.org JSON-LD from our own content, "<" escaped by serializeJsonLd
				dangerouslySetInnerHTML={{ __html: jsonLd }}
				type="application/ld+json"
			/>
			<DocsTitle>{page.data.title}</DocsTitle>
			<DocsDescription className="mb-0">
				{page.data.description}
			</DocsDescription>
			<div className="flex flex-row items-center gap-2 border-b pb-6">
				<MarkdownCopyButton markdownUrl={markdownUrl} />
				<ViewOptionsPopover
					githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}`}
					markdownUrl={markdownUrl}
				/>
			</div>
			<DocsBody>
				<MDX
					components={getMDXComponents({
						// this allows you to link to other pages with relative file paths
						a: createRelativeLink(source, page),
					})}
				/>
			</DocsBody>
		</DocsPage>
	);
}

export function generateStaticParams() {
	return source.generateParams();
}

export async function generateMetadata(
	props: PageProps<"/docs/[[...slug]]">
): Promise<Metadata> {
	const params = await props.params;
	const page = source.getPage(params.slug);
	if (!page) {
		notFound();
	}

	return {
		title: page.data.title,
		description: page.data.description,
		alternates: {
			canonical: page.url,
		},
		openGraph: {
			type: "article",
			title: page.data.title,
			description: page.data.description,
			url: page.url,
			images: getPageImage(page).url,
		},
		twitter: {
			card: "summary_large_image",
			title: page.data.title,
			description: page.data.description,
			images: getPageImage(page).url,
		},
	};
}
