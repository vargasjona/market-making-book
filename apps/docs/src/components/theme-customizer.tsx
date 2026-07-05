"use client";

import { Monitor, Moon, Paintbrush, Sun, Undo2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

const ACCENTS = [
  { name: "orange", swatch: "#ea580c" },
  { name: "rose", swatch: "#e11d48" },
  { name: "red", swatch: "#dc2626" },
  { name: "yellow", swatch: "#ca8a04" },
  { name: "gray", swatch: "#4b5563" },
  { name: "stone", swatch: "#57534e" },
  { name: "green", swatch: "#16a34a" },
  { name: "blue", swatch: "#2563eb" },
  { name: "violet", swatch: "#7c3aed" },
] as const;

const MODES = [
  { name: "system", label: "System", Icon: Monitor },
  { name: "light", label: "Light", Icon: Sun },
  { name: "dark", label: "Dark", Icon: Moon },
] as const;

const STORAGE_KEY = "mm-accent";
const DEFAULT_ACCENT = "orange";

function applyAccent(accent: string) {
  if (accent === DEFAULT_ACCENT) {
    delete document.documentElement.dataset.accent;
    localStorage.removeItem(STORAGE_KEY);
  } else {
    document.documentElement.dataset.accent = accent;
    localStorage.setItem(STORAGE_KEY, accent);
  }
}

/**
 * Floating "Customize" panel (TurboStarter-style): pick the accent color and
 * the color mode. Accent persists in localStorage and is applied before paint
 * by the inline script in the root layout.
 */
export function ThemeCustomizer() {
  const [open, setOpen] = useState(false);
  const [accent, setAccent] = useState<string>(DEFAULT_ACCENT);
  const { theme, setTheme } = useTheme();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAccent(document.documentElement.dataset.accent ?? DEFAULT_ACCENT);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const pick = (name: string) => {
    setAccent(name);
    applyAccent(name);
  };

  const reset = () => {
    pick(DEFAULT_ACCENT);
    setTheme("light");
  };

  return (
    <div className="relative" ref={panelRef}>
      {open && (
        <div className="absolute right-0 w-72 rounded-xl border bg-fd-popover p-4 text-fd-popover-foreground shadow-xl max-lg:bottom-full max-lg:mb-2 lg:top-full lg:mt-2">
          <div className="mb-1 flex items-start justify-between">
            <div>
              <p className="font-semibold text-sm">Customize</p>
              <p className="text-fd-muted-foreground text-xs">
                Pick a style and color for the book.
              </p>
            </div>
            <button
              aria-label="Reset to defaults"
              className="rounded-md p-1.5 hover:bg-fd-accent"
              onClick={reset}
              type="button"
            >
              <Undo2 className="size-4" />
            </button>
          </div>
          <p className="mt-3 mb-1.5 font-medium text-xs">Color</p>
          <div className="grid grid-cols-3 gap-1.5">
            {ACCENTS.map((a) => (
              <button
                className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs capitalize hover:bg-fd-accent ${
                  accent === a.name
                    ? "border-fd-primary ring-1 ring-fd-primary"
                    : ""
                }`}
                key={a.name}
                onClick={() => pick(a.name)}
                type="button"
              >
                <span
                  aria-hidden
                  className="size-3 rounded-full"
                  style={{ background: a.swatch }}
                />
                {a.name}
              </button>
            ))}
          </div>
          <p className="mt-3 mb-1.5 font-medium text-xs">Mode</p>
          <div className="grid grid-cols-3 gap-1.5">
            {MODES.map(({ name, label, Icon }) => (
              <button
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs hover:bg-fd-accent ${
                  theme === name
                    ? "border-fd-primary ring-1 ring-fd-primary"
                    : ""
                }`}
                key={name}
                onClick={() => setTheme(name)}
                type="button"
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        aria-label="Customize theme"
        className="flex size-9 items-center justify-center rounded-full border bg-fd-popover/80 text-fd-muted-foreground backdrop-blur transition-colors hover:text-fd-foreground"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <Paintbrush className="size-4.5" />
      </button>
    </div>
  );
}
