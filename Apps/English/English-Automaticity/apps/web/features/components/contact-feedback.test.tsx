import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FEEDBACK_EMAIL } from "@automaticity/learning-core/feedback";
import SupportPage from "@/app/support/page";
import PrivacyPage from "@/app/privacy/page";
import { ContactFeedback } from "@/features/components/contact-feedback";

test("the contact form names its fields, limit and address", () => {
  const html = renderToStaticMarkup(
    createElement(ContactFeedback, { address: "feedback@example.org" }),
  );
  expect(html).toContain('id="contact"');
  expect(html).toContain("Contact us");
  expect(html).toContain('for="contact-category"');
  expect(html).toContain('for="contact-message"');
  expect(html).toContain('maxLength="1500"');
  expect(html).toContain('href="mailto:feedback@example.org"');
  expect(html).toContain("Write email");
  expect(html).toContain("Copy message");
});

test("support and privacy pages hide contact until an address is configured", () => {
  const support = renderToStaticMarkup(createElement(SupportPage));
  const privacy = renderToStaticMarkup(createElement(PrivacyPage));
  if (FEEDBACK_EMAIL) {
    expect(support).toContain('id="contact"');
    expect(privacy).toContain(FEEDBACK_EMAIL);
  } else {
    expect(support).not.toContain('id="contact"');
    expect(support).not.toContain("mailto:");
    expect(privacy).not.toContain("mailto:");
    expect(privacy).toContain("Open installation and support guide");
  }
});
