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
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
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
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
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
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
  };
}
