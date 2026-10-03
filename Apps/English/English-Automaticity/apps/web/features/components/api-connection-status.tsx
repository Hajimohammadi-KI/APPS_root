"use client";

import * as React from "react";
import { usesDevicePractice } from "@/lib/api-origin";

type ConnectionState = "checking" | "connected" | "offline" | "device";

const statusCopy: Record<ConnectionState, string> = {
	device: "Practice on this device",
  checking: "Checking app service",
	connected: "Local app service ready",
	offline: "Local app service unavailable",
};

export function ApiConnectionStatus({ baseUrl }: { baseUrl: string }) {
	const [status, setStatus] = React.useState<ConnectionState>("checking");
	const [retryRequest, setRetryRequest] = React.useState(0);

	React.useEffect(() => {
		if (usesDevicePractice(baseUrl, window.location.hostname)) {
			setStatus("device");
			return;
		}
		let active = true;
		let timer: ReturnType<typeof setTimeout> | undefined;
		let target: URL;
		try {
			target = new URL(baseUrl, window.location.origin);
		} catch {
			setStatus("offline");
			return () => {
				active = false;
			};
		}
		async function checkConnection() {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 2500);
			try {
				const response = await fetch(`${target.origin}${target.pathname.replace(/\/$/, "")}/api/health`, {
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
	}, [baseUrl, retryRequest]);

	return (
		<button
			aria-label={status === "offline" ? "Retry local app service" : statusCopy[status]}
			aria-live="polite"
			className="hidden min-h-9 items-center gap-2 rounded-full border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 sm:inline-flex"
			disabled={status === "checking" || status === "device"}
			onClick={() => {
				// Retry without reloading the page, which protects an unsaved learner answer.
				setStatus("checking");
				setRetryRequest((request) => request + 1);
			}}
			title={status === "device" ? "Answers are saved on this device. The optional online assessment service is not configured." : `${statusCopy[status]} · ${baseUrl}`}
			type="button"
		>
			<span
				aria-hidden="true"
				className="size-2 rounded-full"
				style={{
					backgroundColor:
						status === "connected"
							? "#3d5a9e"
							: status === "offline"
								? "#c05640"
								: "#a16207",
				}}
			/>
			{statusCopy[status]}
		</button>
	);
}
