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

  it("exposes Deutsch mit Marija as a dedicated course section", () => {
    expect(
      secondaryNavigation.filter((item) => item.href === "/deutsch-mit-marija"),
    ).toHaveLength(1);
  });
});
