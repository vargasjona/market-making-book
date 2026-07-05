import { generate as DefaultImage } from "fumadocs-ui/og";
import { ImageResponse } from "next/og";
import { appDescription, appName } from "@/lib/shared";

export const alt = appName;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
	return new ImageResponse(
		<DefaultImage
			description={appDescription}
			site={appName}
			title={appName}
		/>,
		size
	);
}
