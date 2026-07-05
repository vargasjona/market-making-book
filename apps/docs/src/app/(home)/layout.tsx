import { SpeedInsights } from "@vercel/speed-insights/next";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { MobileNavControls } from "@/components/top-right-controls";
import { baseOptions } from "@/lib/layout.shared";

export default function Layout({ children }: LayoutProps<"/">) {
	const base = baseOptions();

	return (
		<HomeLayout
			{...base}
			links={[
				{
					type: "custom",
					children: <MobileNavControls />,
					secondary: true,
				},
			]}
		>
			{children}
			<SpeedInsights />
		</HomeLayout>
	);
}
