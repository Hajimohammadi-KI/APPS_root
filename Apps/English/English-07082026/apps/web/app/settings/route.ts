export function GET() {
	return Response.redirect(process.env.NEXT_PUBLIC_SETTINGS_URL ?? "http://127.0.0.1:4323/settings", 307);
}
