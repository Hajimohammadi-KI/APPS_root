import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// The worksheet palette is registered in globals.css (@theme); tailwind-merge
// must know the names so cn() resolves bg-/text-/border- conflicts for them.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        "worksheet-paper",
        "worksheet-ink",
        "worksheet-teal",
        "worksheet-teal-hover",
        "worksheet-cyan",
        "worksheet-yellow",
        "worksheet-line",
        "worksheet-muted",
        "worksheet-success",
        "worksheet-success-strong",
        "worksheet-success-ink",
        "worksheet-success-ink-strong",
        "worksheet-success-line",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
