const LOCAL_API_ORIGIN = (
	process.env.LOCAL_API_ORIGIN ?? "http://127.0.0.1:4201"
).replace(/\/$/, "");

type ProxyContext = {
	params: Promise<{ path: string[] }>;
};

function upstreamUrl(request: Request, path: string[]) {
	const safePath = path.map(encodeURIComponent).join("/");
	const target = new URL(`${LOCAL_API_ORIGIN}/${safePath}`);
	target.search = new URL(request.url).search;
	return target;
}

async function proxyLocalApi(request: Request, context: ProxyContext) {
	const { path } = await context.params;
	if (!path.length) {
		return Response.json({ error: "Missing local API path." }, { status: 400 });
	}

	const headers = new Headers();
	for (const name of ["accept", "content-type"]) {
		const value = request.headers.get(name);
		if (value) headers.set(name, value);
	}

	try {
		const init: RequestInit = {
			method: request.method,
			headers,
			cache: "no-store",
			signal: request.signal,
		};
		if (request.method !== "GET" && request.method !== "HEAD") {
			init.body = await request.arrayBuffer();
		}
		const response = await fetch(upstreamUrl(request, path), init);
		const responseHeaders = new Headers();
		for (const name of ["content-type", "cache-control"]) {
			const value = response.headers.get(name);
			if (value) responseHeaders.set(name, value);
		}
		return new Response(response.body, {
			status: response.status,
			headers: responseHeaders,
		});
	} catch {
		return Response.json(
			{ error: "The local English service is unavailable." },
			{ status: 503 },
		);
	}
}

export const GET = proxyLocalApi;
export const HEAD = proxyLocalApi;
export const POST = proxyLocalApi;
export const PUT = proxyLocalApi;
export const PATCH = proxyLocalApi;
export const DELETE = proxyLocalApi;
