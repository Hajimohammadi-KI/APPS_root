import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		id: "/",
		name: "English Grammar Automaticity",
		short_name: "Grammar Automaticity",
		description:
			"Offline-first grammar and speaking practice with daily retrieval, correction, and spaced review.",
		scope: "/",
		start_url: "/",
		display: "standalone",
		orientation: "any",
		background_color: "#f3f6fb",
		theme_color: "#155eef",
		lang: "en",
		categories: ["education", "productivity"],
		prefer_related_applications: false,
		screenshots: [
			{
				src: "/screenshots/dashboard-wide.png",
				sizes: "1280x720",
				type: "image/png",
				form_factor: "wide",
				label: "Grammar Automaticity installation and learning dashboard",
			},
			{
				src: "/screenshots/navigation-narrow.png",
				sizes: "390x844",
				type: "image/png",
				form_factor: "narrow",
				label: "Modern accordion navigation on a phone",
			},
		],
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
				src: "/icons/icon-192.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "maskable",
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
				name: "Today’s Practice",
				short_name: "Today",
				description: "Open the adaptive daily automaticity mission.",
				url: "/daily",
				icons: [
					{
						src: "/icons/icon-192.png",
						sizes: "192x192",
						type: "image/png",
					},
				],
			},
			{
				name: "Conversation Studio",
				short_name: "Studio",
				description: "Open the guided speaking and correction studio.",
				url: "/studio",
				icons: [
					{
						src: "/icons/icon-192.png",
						sizes: "192x192",
						type: "image/png",
					},
				],
			},
			{
				name: "Grammar Lab",
				short_name: "Grammar Lab",
				description: "Open all 112 grammar practice units.",
				url: "/grammar",
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
