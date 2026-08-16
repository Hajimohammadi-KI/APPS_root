import type { Metadata } from "next";
import StudioSource from "./source/studio-source";

export const metadata: Metadata = {
	title: "Conversation Studio | English Automaticity",
	description: "Record, review, correct, and repeat real English speaking.",
};

export default function StudioPage() {
	return <StudioSource />;
}
