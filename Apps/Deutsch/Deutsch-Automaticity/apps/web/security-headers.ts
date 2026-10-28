// Response headers for every route (roadmap R90). The policy keeps the app
// working as built today: Next.js and the hand-written practice pages rely on
// inline scripts and styles, learners may point the optional evaluation
// service at a local or https origin, and audio practice uses blob URLs.
// Development builds additionally need eval for source maps.
export function contentSecurityPolicy(
  production = process.env.NODE_ENV === "production",
) {
  const script = production
    ? "'self' 'unsafe-inline'"
    : "'self' 'unsafe-inline' 'unsafe-eval'";
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src ${script}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "media-src 'self' blob: data:",
    "worker-src 'self' blob:",
    "connect-src 'self' https: http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:*",
    "manifest-src 'self'",
  ].join("; ");
}

export function securityHeaders(production?: boolean) {
  return [
    {
      key: "Content-Security-Policy",
      value: contentSecurityPolicy(production),
    },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "microphone=(self), camera=(), geolocation=(), payment=()",
    },
  ];
}
