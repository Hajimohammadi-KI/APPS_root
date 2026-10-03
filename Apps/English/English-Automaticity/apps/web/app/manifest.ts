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
		// Screenshots are optional; omit unavailable LFS placeholders instead of advertising malformed images to installers.
		icons: [
			{
				src: "/icons/automaticity.svg",
				sizes: "any",
				type: "image/svg+xml",
				purpose: "any",
			},
			{
				src: "/icons/automaticity.svg",
				sizes: "any",
				type: "image/svg+xml",
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
						src: "/icons/automaticity.svg",
						sizes: "any",
						type: "image/svg+xml",
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
						src: "/icons/automaticity.svg",
						sizes: "any",
						type: "image/svg+xml",
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
						src: "/icons/automaticity.svg",
						sizes: "any",
						type: "image/svg+xml",
					},
				],
			},
		],
	};
}
