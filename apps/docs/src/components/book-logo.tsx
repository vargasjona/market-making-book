import { cn } from "@/lib/cn";

/** Inline copy of app/icon.svg so in-page branding matches the favicon. */
export function BookLogo({ className }: { className?: string }) {
	return (
		<svg
			aria-hidden="true"
			className={cn("size-6 shrink-0", className)}
			viewBox="0 0 32 32"
		>
			<rect fill="#ea580c" height="32" rx="7" width="32" />
			<rect
				fill="#fff"
				height="10"
				opacity="0.95"
				rx="1"
				width="4"
				x="7"
				y="9"
			/>
			<rect fill="#fff" height="16" opacity="0.7" width="1" x="8.5" y="6" />
			<rect fill="#ffedd5" height="9" rx="1" width="4" x="14" y="12" />
			<rect fill="#ffedd5" height="15" opacity="0.7" width="1" x="15.5" y="9" />
			<rect
				fill="#fff"
				height="12"
				opacity="0.95"
				rx="1"
				width="4"
				x="21"
				y="7"
			/>
			<rect fill="#fff" height="17" opacity="0.7" width="1" x="22.5" y="5" />
		</svg>
	);
}
