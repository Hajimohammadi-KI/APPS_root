"use client";

import * as React from "react";

type ConnectionState = "checking" | "connected" | "offline";

const statusCopy: Record<ConnectionState, string> = {
	checking: "Checking app service",
	connected: "Local app service ready",
	offline: "Local app service unavailable",
};

function isLoopbackHost(hostname: string) {
	return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1";
}

export function ApiConnectionStatus({ baseUrl }: { baseUrl: string }) {
	const [status, setStatus] = React.useState<ConnectionState>("checking");

	React.useEffect(() => {
		let active = true;
		let timer: ReturnType<typeof setTimeout> | undefined;
		const target = new URL(baseUrl, window.location.origin);
		const isPublicWebUsingLocalService =
			!isLoopbackHost(window.location.hostname) && isLoopbackHost(target.hostname);

		if (isPublicWebUsingLocalService) {
			setStatus("offline");
			return () => {
				active = false;
			};
		}

		async function checkConnection() {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 2500);
			try {
				const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/health`, {
					cache: "no-store",
					signal: controller.signal,
				});
				if (active) setStatus(response.ok ? "connected" : "offline");
			} catch {
				if (active) setStatus("offline");
			} finally {
				clearTimeout(timeout);
				if (active) timer = setTimeout(checkConnection, 30_000);
			}
		}

		setStatus("checking");
		void checkConnection();
		return () => {
			active = false;
			if (timer) clearTimeout(timer);
		};
	}, [baseUrl]);

	return (
		<span
			aria-live="polite"
			className="hidden min-h-9 items-center gap-2 rounded-full border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 sm:inline-flex"
			title={`${statusCopy[status]} · ${baseUrl}`}
		>
			<span
				aria-hidden="true"
				className="size-2 rounded-full"
				style={{
					backgroundColor:
						status === "connected"
							? "#15803d"
							: status === "offline"
								? "#b91c1c"
								: "#a16207",
				}}
			/>
			{statusCopy[status]}
		</span>
	);
}
