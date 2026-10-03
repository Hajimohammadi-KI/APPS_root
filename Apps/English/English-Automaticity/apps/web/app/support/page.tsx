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
            Open this web app on your phone, tablet, or computer. Your progress
            is saved separately in each browser on each device.
          </p>
        </header>

        <div className="legal-grid">
          <section className="legal-card">
            <h2>Windows</h2>
            <p>
              Open this web app in Microsoft Edge and choose
              <strong> Apps → Install English Automaticity</strong>.
            </p>
          </section>

          <section className="legal-card">
            <h2>Android</h2>
            <p>
              Open this web app in Chrome. In the browser menu, choose
              <strong> Add to Home screen</strong> or <strong>Install app</strong>
              when offered.
            </p>
          </section>

          <section className="legal-card">
            <h2>iPhone and iPad</h2>
            <p>
              Open this web app in Safari and use
              <strong> Share → Add to Home Screen</strong>.
            </p>
          </section>

          <section className="legal-card">
            <h2>Offline use</h2>
            <p>
              Open the app once with internet access after each update.
              Catalogs, exercises, progress, settings, and supported audio
              recordings work locally. Full LanguageTool evaluation requires
              a configured online service.
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
              The public web app supports practice on this device. Online
              assessment needs a separately configured service. Offline correction supports practice,
              but intentionally does not unlock a verified checkpoint.
            </p>
            <Link href="/privacy">Read privacy notice →</Link>
          </section>
        </div>
      </div>
    </main>
  );
}
