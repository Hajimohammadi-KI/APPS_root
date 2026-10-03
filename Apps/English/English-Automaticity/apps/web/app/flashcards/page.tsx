import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Vocabulary & Flashcards | English Automaticity",
	description: "Open and install the connected LexiBridge vocabulary extension.",
};

export default function FlashcardsPage() {
	return (
		<main style={{ minHeight: "100vh", padding: "clamp(24px, 6vw, 72px)", background: "#f8f5fc", color: "#17132b" }}>
			<section style={{ maxWidth: 820, margin: "0 auto", padding: "clamp(24px, 5vw, 52px)", border: "1px solid #d8c9ed", borderRadius: 28, background: "white", boxShadow: "0 18px 50px rgba(82, 49, 128, .10)" }}>
				<p style={{ color: "#7043ad", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}>Connected learning tool</p>
				<h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", margin: "12px 0" }}>Vocabulary & Flashcards</h1>
				<p style={{ fontSize: "1.12rem", lineHeight: 1.7, maxWidth: 680 }}>
					LexiBridge turns selected English, German, or Persian text into light highlights and spaced-repetition cards. Your cards remain in your browser profile.
				</p>
				<div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
					<a href="/downloads/lexibridge-extension.zip" download style={{ padding: "14px 20px", borderRadius: 14, background: "#7043ad", color: "white", fontWeight: 800, textDecoration: "none" }}>Download LexiBridge</a>
					<a href="/daily" style={{ padding: "14px 20px", border: "1px solid #7043ad", borderRadius: 14, color: "#4c2e78", fontWeight: 800, textDecoration: "none" }}>Back to Today’s Practice</a>
				</div>
				<p style={{ marginTop: 24, color: "#635a70", lineHeight: 1.6 }}>
					After downloading, extract the ZIP and choose <strong>Load unpacked</strong> on your browser’s Extensions page. Chrome and Edge require this one-time approval and do not allow an app to install an extension silently.
				</p>
			</section>
		</main>
	);
}
