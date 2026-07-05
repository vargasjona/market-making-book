"use client";

import { useEffect } from "react";
import { initChapter } from "./fig-runtime";

/**
 * Mounts the interactive-figure runtime for one book chapter.
 * Placed at the end of each chapter's MDX; initChapter wires the chapter's
 * canvases/controls and returns a cleanup that stops animation loops and
 * removes window listeners on navigation.
 */
export function FigRuntime({ chapter }: { chapter: string }) {
	useEffect(() => initChapter(chapter), [chapter]);
	return null;
}
