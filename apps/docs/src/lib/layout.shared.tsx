import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { BookLogo } from "@/components/book-logo";
import { appName } from "./shared";

// GitHub link + theme toggle live in the top-right corner instead
// (see components/top-right-controls.tsx), so no githubUrl here.
export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			title: (
				<>
					<BookLogo className="size-5" />
					<span className="whitespace-nowrap text-sm">{appName}</span>
				</>
			),
		},
		themeSwitch: {
			enabled: false,
		},
	};
}
