import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  description:
    "Installation, offline use, backup, and evaluation help for English Automaticity.",
  title: "Support | English Automaticity",
};

export default function SupportPage() {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <Link className="legal-back" href="/">
          ← Back to learning app
        </Link>

        <header className="legal-hero legal-hero-support">
          <span className="legal-kicker">
            Install once, practice anywhere
          </span>
          <h1>Installation and Support</h1>
          <p>
            The same complete learning system is available on Windows,
            Android, iPhone, and iPad.
          </p>
        </header>

        <div className="legal-grid">
          <section className="legal-card">
            <h2>Windows</h2>
            <p>
              After release, use the Microsoft Store package, or open the
              secure web URL in Microsoft Edge and choose
              <strong> Apps → Install English Automaticity</strong>.
            </p>
          </section>

          <section className="legal-card">
            <h2>Android</h2>
            <p>
              After release, use the Google Play listing. For direct testing,
              install the signed APK or open the secure web URL in Chrome and
              choose <strong>Install app</strong>.
            </p>
          </section>

          <section className="legal-card">
            <h2>iPhone and iPad</h2>
            <p>
              Use the App Store or TestFlight once the build is available. The
              web version can also be installed in Safari via
              <strong> Share → Add to Home Screen</strong>.
            </p>
          </section>

          <section className="legal-card">
            <h2>Offline use</h2>
            <p>
              Open the app once with internet access after each update.
              Catalogs, exercises, progress, settings, and supported audio
              recordings work locally. Full LanguageTool evaluation still
              requires internet.
            </p>
          </section>

          <section className="legal-card">
            <h2>Keep your progress</h2>
            <p>
              Use <strong>Settings → Export data</strong> before switching
              devices, uninstalling the app, or clearing browser data. Import
              the file on your new device.
            </p>
          </section>

          <section className="legal-card">
            <h2>Evaluation issues</h2>
            <p>
              Check API status in Settings. If unavailable, check your internet
              connection and try again. Offline correction supports practice,
              but intentionally does not unlock a verified checkpoint.
            </p>
            <Link href="/privacy">Read privacy notice →</Link>
          </section>
        </div>
      </div>
    </main>
  );
}
