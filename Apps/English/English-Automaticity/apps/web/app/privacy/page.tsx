import type { Metadata } from "next";
import Link from "next/link";
import { feedbackAddress } from "@automaticity/learning-core/feedback";

export const metadata: Metadata = {
  description:
    "How English Automaticity stores learning progress and processes optional online evaluation.",
  title: "Privacy | English Automaticity",
};

const updated = "July 28, 2026";

export default function PrivacyPage() {
  const contact = feedbackAddress();
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <Link className="legal-back" href="/">
          ← Back to learning app
        </Link>

        <header className="legal-hero">
          <span className="legal-kicker">Clear, local-first data handling</span>
          <h1>Privacy</h1>
          <p>
            English Automaticity is designed so the full learning catalog and
            most learning data stay on your device.
          </p>
          <span>Last updated: {updated}</span>
        </header>

        <div className="legal-grid">
          <section className="legal-card">
            <h2>Data stored on your device</h2>
            <p>
              Progress, settings, responses, error history, review status, and
              locally recorded audio are stored in browser storage or IndexedDB.
              In this version, they are not synced with a user account. Removing
              the app or clearing website data may delete them.
            </p>
          </section>

          <section className="legal-card">
            <h2>Online grammar evaluation</h2>
            <p>
              When you explicitly start an evaluation, your response text and
              selected English variant are sent via HTTPS to the app's NestJS
              service. It forwards the text to LanguageTool for spelling and
              grammar checks and returns correction results. Text is not used
              for advertising.
            </p>
          </section>

          <section className="legal-card">
            <h2>Comments on a checked answer</h2>
            <p>
              Under a checked written answer you can send a comment, for example
              that you think your answer is correct. Only after you confirm the
              preview each time, the app sends exactly that preview: the
              exercise, the stored answers, your answer, the app&apos;s check,
              your chosen reason and your comment. Your name, profile, other
              answers, recordings and history are not sent. The comment is
              stored as an issue in a private GitHub repository (GitHub, USA)
              that only the app owner can read, and is used to review answers
              and improve exercises. A comment never changes your result by
              itself; if the owner accepts your answer as correct or explains a
              wrong form, that form can become part of the exercise without any
              link to you. Your browser keeps a receipt under “My comments”,
              where you can check the status, read the owner&apos;s reply, or
              withdraw the comment. Withdrawing deletes your text and the
              owner&apos;s reply; only a closed entry with the exercise number
              and the reason you chose remains.
            </p>
          </section>

          <section className="legal-card">
            <h2>Microphone and speech features</h2>
            <p>
              Microphone access is requested only when you start recording or
              supported speech recognition. Saved recordings stay on your
              device. Browser speech recognition may be processed under your
              browser or operating system provider's privacy terms.
            </p>
          </section>

          <section className="legal-card">
            <h2>Accounts, advertising, and tracking</h2>
            <p>
              This version includes no learning accounts, no ad SDK, no sale of
              personal data, and no cross-app tracking. The hosting platform may
              process standard technical request data required to provide and
              protect the service.
            </p>
          </section>

          <section className="legal-card">
            <h2>Your controls</h2>
            <p>
              Settings include export, import, and reset tools. You can deny
              microphone access, use offline learning content without recording,
              and remove local data in the app or your device's website/app
              settings.
            </p>
          </section>

          <section className="legal-card">
            <h2>Questions and deletion requests</h2>
            <p>
              Because this version does not create server-side learning
              accounts, local learning data is controlled from the device.
              {contact
                ? ` For questions or feedback, write to ${contact}. Feedback reaches us as an ordinary email with your address and message; it is used only to reply and to improve the apps, and is deleted on request.`
                : " Distribution owners should include a public support contact in store listings before release."}
            </p>
            <Link href={contact ? "/support#contact" : "/support"}>
              {contact
                ? "Contact us →"
                : "Open installation and support guide →"}
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
