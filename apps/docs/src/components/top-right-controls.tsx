"use client";

import { Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { BookLogo } from "@/components/book-logo";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { appName, gitConfig } from "@/lib/shared";

const buttonClass =
	"flex size-9 items-center justify-center rounded-full border bg-fd-popover/80 text-fd-muted-foreground backdrop-blur transition-colors hover:text-fd-foreground";

function GithubButton() {
	return (
		<a
			aria-label="GitHub repository"
			className={buttonClass}
			href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
			rel="noreferrer noopener"
			target="_blank"
		>
			<svg fill="currentColor" height="18" viewBox="0 0 24 24" width="18">
				<title>GitHub</title>
				<path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.78 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.26 5.66.41.36.78 1.06.78 2.14v3.17c0 .3.21.67.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
			</svg>
			<span className="sr-only">GitHub repository</span>
		</a>
	);
}

function ThemeToggleButton() {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	const isDark = mounted && resolvedTheme === "dark";

	return (
		<button
			aria-label="Toggle dark mode"
			className={buttonClass}
			onClick={() => setTheme(isDark ? "light" : "dark")}
			type="button"
		>
			{isDark ? <Moon className="size-4.5" /> : <Sun className="size-4.5" />}
		</button>
	);
}

/**
 * Desktop-only cluster fixed to the top-right of the viewport: GitHub icon,
 * a single theme-toggle icon, and the theme customizer. On mobile these
 * controls render inside the navigation menu instead (see MobileNavControls).
 */
export function TopRightControls() {
	return (
		<div className="fixed top-3 right-4 z-40 flex items-center gap-1.5 max-lg:hidden [[data-ai-chat-open]_&]:hidden">
			<GithubButton />
			<ThemeToggleButton />
			<ThemeCustomizer />
		</div>
	);
}

/**
 * Mobile-only row with the same controls, shown at the top of the opened
 * navigation menu (fumadocs-style): GitHub on the left, theme controls on
 * the right. Rendered via DocsLayout sidebar.banner / HomeLayout menu link.
 */
export function MobileNavControls() {
	return (
		<div className="flex items-center justify-between lg:hidden">
			<GithubButton />
			<div className="flex items-center gap-1.5">
				<ThemeToggleButton />
				<ThemeCustomizer />
			</div>
		</div>
	);
}

/**
 * Banner for the docs sidebar on mobile: book logo + name linking home,
 * with the nav controls row underneath. The home layout navbar already
 * shows the title, so it keeps using plain MobileNavControls.
 */
export function MobileSidebarBanner() {
	return (
		<div className="flex flex-col gap-3 lg:hidden">
			<Link
				className="inline-flex items-center gap-2.5 font-medium text-fd-foreground"
				href="/"
			>
				<BookLogo />
				{appName}
			</Link>
			<MobileNavControls />
		</div>
	);
}
