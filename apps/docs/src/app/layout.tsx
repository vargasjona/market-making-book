import { RootProvider } from "fumadocs-ui/provider/next";
import "./global.css";
import "./book.css";
import "./theme.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { TopRightControls } from "@/components/top-right-controls";
import { appDescription, appName, getBaseUrl } from "@/lib/shared";

export const metadata: Metadata = {
	metadataBase: new URL(getBaseUrl()),
	title: {
		default: appName,
		template: `%s | ${appName}`,
	},
	description: appDescription,
	applicationName: appName,
	openGraph: {
		type: "website",
		siteName: appName,
		title: appName,
		description: appDescription,
		url: "/",
	},
	twitter: {
		card: "summary_large_image",
	},
	robots: {
		index: true,
		follow: true,
	},
	alternates: {
		canonical: "/",
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#faf6ee" },
		{ media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
	],
};

const inter = Inter({
	subsets: ["latin"],
});

// Applies the persisted accent before first paint to avoid a color flash.
const accentInit = `try{var a=localStorage.getItem("mm-accent");if(a)document.documentElement.dataset.accent=a}catch(e){}`;

export default function Layout({ children }: LayoutProps<"/">) {
	return (
		<html className={inter.className} lang="en" suppressHydrationWarning>
			<head>
				{/* Book typography. Loaded as real font families (not next/font) because
            the figure runtime draws with them on <canvas>, which needs the
            actual family names ("IBM Plex Mono", …), not hashed ones. */}
				<link href="https://fonts.googleapis.com" rel="preconnect" />
				<link
					crossOrigin="anonymous"
					href="https://fonts.gstatic.com"
					rel="preconnect"
				/>
				<link
					href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
					rel="stylesheet"
				/>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: static accent bootstrap, no user input */}
				<script dangerouslySetInnerHTML={{ __html: accentInit }} />
			</head>
			<body className="flex min-h-screen flex-col">
				<RootProvider theme={{ defaultTheme: "light" }}>
					{children}
					<TopRightControls />
				</RootProvider>
			</body>
		</html>
	);
}
