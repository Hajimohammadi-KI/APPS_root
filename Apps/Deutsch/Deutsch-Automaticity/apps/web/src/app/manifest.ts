import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DeutschFlow – Grammatik automatisieren",
    short_name: "DeutschFlow",
    description:
      "Deutsche Grammatik gezielt abrufen, anwenden und automatisieren.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone"],
    orientation: "any",
    background_color: "#f5fbff",
    theme_color: "#38bdf8",
    lang: "de",
    categories: ["education", "productivity"],
    prefer_related_applications: false,
    launch_handler: {
      client_mode: "focus-existing",
    },
    icons: [
      {
        src: "/icons/deutschflow.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/deutschflow.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Heutiges Training",
        short_name: "Heute",
        description: "Die adaptive Automatik-Mission für heute öffnen",
        url: "/heute",
        icons: [
          {
            src: "/icons/deutschflow.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
        ],
      },
      {
        name: "Gesprächsstudio",
        short_name: "Studio",
        description: "Freies Sprechen und Schreiben trainieren",
        url: "/studio",
        icons: [
          {
            src: "/icons/deutschflow.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
        ],
      },
    ],
  };
}
