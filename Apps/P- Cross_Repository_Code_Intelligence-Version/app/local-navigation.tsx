"use client";

import { usePathname } from "next/navigation";

export default function LocalNavigation() {
  const pathname = usePathname();

  // The PDF reader has its own document navigation. A second floating
  // back/start/forward bar obscures notes and annotation controls.
  if (pathname.startsWith("/pdf-reader")) return null;

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.assign("/");
  };

  return (
    <nav className="local-route-nav" aria-label="Seitennavigation">
      <button type="button" onClick={goBack} aria-label="Zur vorherigen Seite">
        <span aria-hidden="true">←</span><b>Zurück</b>
      </button>
      <button type="button" onClick={() => window.location.assign("/")} aria-label="Zur Startseite">
        <span aria-hidden="true">⌂</span><b>Start</b>
      </button>
      <button type="button" onClick={() => window.history.forward()} aria-label="Zur nächsten Seite">
        <b>Weiter</b><span aria-hidden="true">→</span>
      </button>
    </nav>
  );
}
