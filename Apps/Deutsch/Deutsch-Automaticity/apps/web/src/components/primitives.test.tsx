import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { PageHeader } from "./page-header";
import { Disclosure } from "./ui/disclosure";
import { MissionRail, MissionTile } from "./ui/mission-tiles";
import { Notice } from "./ui/notice";
import { SectionBox } from "./ui/section-box";

describe("page header", () => {
  test("keeps the kicker and section-title markup the worksheet styles target", () => {
    const html = renderToStaticMarkup(
      <PageHeader
        description="Gespeicherte Korrekturen."
        kicker="Langzeitgedächtnis"
        title="Wiederholungen"
      />,
    );
    expect(html).toBe(
      '<header><div><p class="section-kicker">Langzeitgedächtnis</p><h1 class="section-title">Wiederholungen</h1><p class="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Gespeicherte Korrekturen.</p></div></header>',
    );
  });

  test("places actions beside the copy only when given", () => {
    const html = renderToStaticMarkup(
      <PageHeader
        actions={<button type="button">Aktualisieren</button>}
        description="Aus IndexedDB."
        kicker="Lokal"
        title="Audio"
      />,
    );
    expect(html).toContain(
      '<header class="flex flex-wrap items-end justify-between gap-3">',
    );
    expect(html).toContain(
      '</div><button type="button">Aktualisieren</button></header>',
    );
  });

  test("framed variant renders the boxed legal header with extra lines", () => {
    const html = renderToStaticMarkup(
      <PageHeader
        description="Lokal."
        framed
        kicker="Datenschutz"
        title="Datenschutz"
      >
        <p>Zuletzt aktualisiert</p>
      </PageHeader>,
    );
    expect(html).toContain(
      '<header class="mb-8 rounded-3xl border bg-card p-6 shadow-sm sm:p-8">',
    );
    expect(html).toContain("<p>Zuletzt aktualisiert</p></header>");
  });
});

describe("notice", () => {
  test("tones are distinct and role passes through", () => {
    const tones = ["neutral", "info", "success", "warning", "danger"] as const;
    const classes = tones.map(
      (tone) =>
        renderToStaticMarkup(<Notice tone={tone}>Hinweis</Notice>).match(
          /class="([^"]+)"/,
        )?.[1],
    );
    expect(new Set(classes).size).toBe(tones.length);
    expect(renderToStaticMarkup(<Notice role="status">Ok</Notice>)).toBe(
      '<div class="rounded-xl border p-3 text-sm leading-6 bg-card" role="status">Ok</div>',
    );
  });
});

describe("disclosure", () => {
  test("quiet and boxed variants", () => {
    expect(
      renderToStaticMarkup(
        <Disclosure summary="Antworten">
          <p>Nachweise</p>
        </Disclosure>,
      ),
    ).toBe(
      '<details class="quiet-disclosure"><summary>Antworten</summary><div><p>Nachweise</p></div></details>',
    );
    expect(
      renderToStaticMarkup(
        <Disclosure
          className="bg-muted/35"
          summary="Einstufung"
          variant="boxed"
        >
          <p>Fragen</p>
        </Disclosure>,
      ),
    ).toBe(
      '<details class="rounded-xl border p-4 bg-muted/35"><summary class="flex cursor-pointer items-center gap-2 text-sm font-bold">Einstufung</summary><p>Fragen</p></details>',
    );
  });
});

describe("mission tiles and section box", () => {
  test("rail is a labelled section of tiles", () => {
    const html = renderToStaticMarkup(
      <MissionRail label="Reparaturmissionen">
        <MissionTile title="Mission 1">Heute reparieren.</MissionTile>
      </MissionRail>,
    );
    expect(html).toContain('<section aria-label="Reparaturmissionen"');
    expect(html).toContain(">Schnellmissionen</h2>");
    expect(html).toContain(
      '<article class="min-w-56 rounded-xl border bg-card p-3 text-sm shadow-sm"><strong class="block">Mission 1</strong><span class="text-muted-foreground">Heute reparieren.</span></article>',
    );
  });

  test("section box keeps heading, paragraph and optional footer", () => {
    expect(
      renderToStaticMarkup(
        <SectionBox footer={<a href="/support">Mehr</a>} title="Windows">
          In Edge installieren.
        </SectionBox>,
      ),
    ).toBe(
      '<section class="rounded-2xl border bg-card p-5 shadow-sm"><h2 class="text-lg font-semibold">Windows</h2><p class="mt-2 text-sm text-muted-foreground">In Edge installieren.</p><a href="/support">Mehr</a></section>',
    );
  });
});
