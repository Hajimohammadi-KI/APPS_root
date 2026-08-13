// The real settings screen renders inside the app shell at "/?screen=settings"
// (see AppShell/SettingsScreen) so it has working accessibility, grammar, and
// backup controls. This route only exists as a safety net for old bookmarks
// or external links that still point at "/settings" directly — it used to
// 307-redirect to an external settings service that isn't part of this app.
export function GET(request: Request) {
	return Response.redirect(new URL("/?screen=settings", request.url), 307);
}
