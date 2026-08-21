import { describe, expect, it } from "bun:test";

import { primaryNavigation, secondaryNavigation } from "./navigation";

describe("application navigation", () => {
  it("uses unique routes", () => {
    const routes = [...primaryNavigation, ...secondaryNavigation].map(
      (item) => item.href,
    );

    expect(new Set(routes).size).toBe(routes.length);
  });

  it("does not advertise the compatibility app in primary navigation", () => {
    expect(primaryNavigation.map((item) => item.href)).not.toContain(
      "/klassik",
    );
  });

  it("exposes one canonical daily automaticity route", () => {
    const routes: readonly string[] = primaryNavigation.map(
      (item) => item.href,
    );
    expect(routes).toContain("/heute");
    expect(routes).not.toContain("/automatik");
    expect(
      primaryNavigation.find((item) => item.href === "/heute")?.label,
    ).toBe("Heutiges Training");
  });

  it("keeps detailed progress in one dedicated route", () => {
    expect(
      primaryNavigation.filter((item) => item.href === "/fortschritt"),
    ).toHaveLength(1);
  });

  it("does not expose private course materials in navigation", () => {
    const routes: readonly string[] = secondaryNavigation.map(
      (item) => item.href,
    );
    expect(routes).not.toContain("/deutsch-mit-marija");
  });
});
