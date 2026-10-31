import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FEEDBACK_EMAIL } from "@automaticity/learning-core/feedback";

import PrivacyPage from "@/app/privacy/page";
import SupportPage from "@/app/support/page";
import { ContactFeedback } from "@/components/contact-feedback";

test("das Kontaktformular benennt Felder, Grenze und Adresse", () => {
  const html = renderToStaticMarkup(
    createElement(ContactFeedback, { address: "feedback@example.org" }),
  );
  expect(html).toContain('id="contact"');
  expect(html).toContain("Kontakt");
  expect(html).toContain('for="contact-category"');
  expect(html).toContain('for="contact-message"');
  expect(html).toContain('maxLength="1500"');
  expect(html).toContain('href="mailto:feedback@example.org"');
  expect(html).toContain("E-Mail schreiben");
  expect(html).toContain("Nachricht kopieren");
});

test("Support und Datenschutz zeigen Kontakt erst mit konfigurierter Adresse", () => {
  const support = renderToStaticMarkup(createElement(SupportPage));
  const privacy = renderToStaticMarkup(createElement(PrivacyPage));
  if (FEEDBACK_EMAIL) {
    expect(support).toContain('id="contact"');
    expect(privacy).toContain(FEEDBACK_EMAIL);
  } else {
    expect(support).not.toContain('id="contact"');
    expect(support).not.toContain("mailto:");
    expect(privacy).not.toContain("mailto:");
    expect(privacy).toContain("Installations- und Supporthilfe öffnen");
  }
});
