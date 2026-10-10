import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { Disclosure } from "./disclosure";
import { Notice } from "./notice";
import { PageHeading } from "./page-heading";

describe("page heading", () => {
  test("keeps the markup the screen styles target", () => {
    const html = renderToStaticMarkup(
      <PageHeading
        actions={<button type="button">Refresh</button>}
        className="settings-heading"
        description="Saved on this device."
        eyebrow={<span>Today</span>}
        title="Settings"
      />,
    );
    expect(html).toBe(
      '<div class="page-heading settings-heading"><div><span>Today</span><h1>Settings</h1><p>Saved on this device.</p></div><button type="button">Refresh</button></div>',
    );
  });

  test("omits eyebrow and actions when they are not given", () => {
    const html = renderToStaticMarkup(
      <PageHeading description="All sources." title="Resources" />,
    );
    expect(html).toBe(
      '<div class="page-heading"><div><h1>Resources</h1><p>All sources.</p></div></div>',
    );
  });
});

describe("notice", () => {
  test("each tone is a distinct bordered box", () => {
    const tones = ["neutral", "info", "success", "warning", "danger"] as const;
    const classes = tones.map((tone) => {
      const html = renderToStaticMarkup(<Notice tone={tone}>Saved</Notice>);
      expect(html).toContain("rounded-xl border p-3 text-sm leading-6");
      return html.match(/class="([^"]+)"/)?.[1];
    });
    expect(new Set(classes).size).toBe(tones.length);
  });

  test("passes through role and extra classes", () => {
    const html = renderToStaticMarkup(
      <Notice className="mt-3" role="alert" tone="warning">
        Check the key
      </Notice>,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("border-amber-300 bg-amber-50 text-amber-950 mt-3");
  });
});

describe("disclosure", () => {
  test("quiet variant wraps content for the worksheet disclosure styles", () => {
    const html = renderToStaticMarkup(
      <Disclosure className="studio-saved-evidence" summary="Saved responses">
        <p>Evidence</p>
      </Disclosure>,
    );
    expect(html).toBe(
      '<details class="quiet-disclosure studio-saved-evidence"><summary>Saved responses</summary><div><p>Evidence</p></div></details>',
    );
  });

  test("boxed variant renders a bordered panel that can start open", () => {
    const html = renderToStaticMarkup(
      <Disclosure open summary="Optional check" variant="boxed">
        <p>Questions</p>
      </Disclosure>,
    );
    expect(html).toContain('<details class="rounded-xl border p-4" open="">');
    expect(html).toContain(
      '<summary class="flex cursor-pointer items-center gap-2 text-sm font-bold">Optional check</summary><p>Questions</p></details>',
    );
  });
});
