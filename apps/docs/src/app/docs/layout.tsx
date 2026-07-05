import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { MessageCircleIcon } from "lucide-react";

import {
	AISearch,
	AISearchPanel,
	AISearchTrigger,
} from "@/components/ai/search";
import { MobileSidebarBanner } from "@/components/top-right-controls";
import { cn } from "@/lib/cn";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";

export default function Layout({ children }: LayoutProps<"/docs">) {
	return (
		<DocsLayout
			sidebar={{ banner: <MobileSidebarBanner key="mobile-sidebar-banner" /> }}
			tree={source.getPageTree()}
			{...baseOptions()}
		>
			<AISearch>
				<AISearchPanel />
				<AISearchTrigger
					className={cn(
						buttonVariants({
							variant: "secondary",
							className: "rounded-2xl text-fd-muted-foreground",
						})
					)}
					position="float"
				>
					<MessageCircleIcon className="size-4.5" />
					Ask AI
				</AISearchTrigger>
			</AISearch>

			{children}
		</DocsLayout>
	);
}
