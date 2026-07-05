import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { appName } from "./shared";

// GitHub link + theme toggle live in the top-right corner instead
// (see components/top-right-controls.tsx), so no githubUrl here.
export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			// JSX supported
			title: appName,
		},
		themeSwitch: {
			enabled: false,
		},
	};
}
