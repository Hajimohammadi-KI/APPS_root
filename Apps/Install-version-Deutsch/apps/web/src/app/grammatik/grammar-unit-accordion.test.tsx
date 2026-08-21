import { afterAll, afterEach, describe, expect, mock, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { useState } from "react";

import { grammarUnits } from "@grammar/content";

import { GrammarUnitAccordion } from "./grammar-unit-accordion";

GlobalRegistrator.register();

const { cleanup, render, screen, within } =
  await import("@testing-library/react");
const { default: userEvent } = await import("@testing-library/user-event");

afterEach(cleanup);
afterAll(() => GlobalRegistrator.unregister());

describe("GrammarUnitAccordion", () => {
  test("renders 24 vertical unit rows and keeps only one CEFR level open", async () => {
    const user = userEvent.setup();
    render(
      <GrammarUnitAccordion onSelect={mock()} selectedTitle={undefined} />,
    );

    const a1Trigger = screen.getByRole("button", {
      name: "A1 · 24 Einheiten",
    });
    const a2Trigger = screen.getByRole("button", {
      name: "A2 · 24 Einheiten",
    });

    expect(a1Trigger.getAttribute("aria-expanded")).toBe("true");
    expect(a2Trigger.getAttribute("aria-expanded")).toBe("false");

    const a1List = screen.getByRole("list", { name: "A1 Einheiten" });
    const unitRows = within(a1List).getAllByRole("button");
    expect(unitRows).toHaveLength(24);
    expect(within(a1List).getAllByRole("listitem")).toHaveLength(24);
    for (const row of unitRows) {
      expect(row.parentElement?.tagName).toBe("LI");
      expect(row.classList.contains("w-full")).toBe(true);
      expect(row.classList.contains("rounded-full")).toBe(false);
    }

    await user.click(a2Trigger);
    expect(a1Trigger.getAttribute("aria-expanded")).toBe("false");
    expect(a2Trigger.getAttribute("aria-expanded")).toBe("true");

    await user.click(a2Trigger);
    expect(a2Trigger.getAttribute("aria-expanded")).toBe("false");

    a1Trigger.focus();
    await user.keyboard("{Enter}");
    expect(a1Trigger.getAttribute("aria-expanded")).toBe("true");
    await user.keyboard(" ");
    expect(a1Trigger.getAttribute("aria-expanded")).toBe("false");
  });

  test("marks the chosen unit as today's selected practice topic", async () => {
    const user = userEvent.setup();
    const onSelect = mock();

    function SelectionHarness() {
      const [selectedTitle, setSelectedTitle] = useState(
        "Personalpronomen und sein",
      );

      return (
        <GrammarUnitAccordion
          onSelect={(unit) => {
            onSelect(unit);
            setSelectedTitle(unit.title);
          }}
          selectedTitle={selectedTitle}
        />
      );
    }

    render(<SelectionHarness />);

    const previousUnit = screen.getByRole("button", {
      name: /Personalpronomen und sein/,
    });
    const nextUnit = screen.getByRole("button", { name: "haben" });
    expect(previousUnit.getAttribute("aria-pressed")).toBe("true");
    expect(nextUnit.getAttribute("aria-pressed")).toBe("false");

    await user.click(nextUnit);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(
      grammarUnits.find((unit) => unit.title === "haben"),
    );
    expect(previousUnit.getAttribute("aria-pressed")).toBe("false");
    expect(nextUnit.getAttribute("aria-pressed")).toBe("true");
    expect(nextUnit.textContent).toContain("Ausgewählt");
  });
});
