import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { FigRuntime } from "@/components/book/fig-runtime-mount";

export function getMDXComponents(components?: MDXComponents) {
	return {
		...defaultMdxComponents,
		FigRuntime,
		...components,
	} satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
	type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
