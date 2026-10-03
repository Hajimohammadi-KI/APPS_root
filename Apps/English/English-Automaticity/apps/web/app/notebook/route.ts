export function GET(request: Request) {
	const incoming = new URL(request.url);
	const target = new URL(process.env.NEXT_PUBLIC_PDF_READER_URL ?? "http://127.0.0.1:4332/");
	target.searchParams.set("lang", "en");
	target.searchParams.set("source", "english-notebook");
	incoming.searchParams.forEach((value, key) => target.searchParams.set(key, value));
	// PDF Studio renders this as a real return button, so a notebook handoff never strands the learner in another app.
	if (!target.searchParams.has("return")) target.searchParams.set("return", `${incoming.origin}/`);
	if (!target.searchParams.has("returnLabel")) target.searchParams.set("returnLabel", "Back to English Automaticity");
	return Response.redirect(target, 307);
}
