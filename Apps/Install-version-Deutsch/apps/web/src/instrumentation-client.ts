import { recordNavigationStart } from "./lib/page-analytics";

export function onRouterTransitionStart(
  url: string,
  navigationType: "push" | "replace" | "traverse",
) {
  recordNavigationStart(url, navigationType);
}
