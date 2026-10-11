/* Presentation only. The navigation comes from navigation-config.js (generated
   from shared/navigation-config.json); existing page controls are only moved so
   their handlers and stored state survive. */
document.addEventListener("DOMContentLoaded", () => {
  const en = document.documentElement.lang !== "de";
  const config = (window.languageNavigation || {})[en ? "en" : "de"];
  if (!config) return;
  const current = location.pathname.replace(/\/$/, "") || "/";
  const link = (item, className) => {
    const a = document.createElement("a");
    a.href = item.href;
    a.className = className;
    a.textContent = item.label;
    if (current === item.href) {
      a.setAttribute("aria-current", "page");
      a.classList.add("active");
    }
    return a;
  };
  const buildPrimaryNav = () => {
    const nav = document.createElement("nav");
    nav.className = "calm-primary-nav";
    nav.setAttribute("aria-label", en ? "Learning navigation" : "Lernnavigation");
    for (const item of config.main) nav.append(link(item, ""));
    return nav;
  };
  // Daily pages keep the ".nav-section/.nav-item" classes, Grammar pages the
  // ".nav-group/.nav-title/.nav-link" classes, so each page's own stylesheet
  // still applies.
  const buildMore = (groupClass, titleTag, titleClass, itemClass) => {
    const more = document.createElement("details");
    more.className = "calm-nav-more";
    if (config.more.some((item) => item.href === current) || config.settings === current) more.open = true;
    const summary = document.createElement("summary");
    summary.textContent = en ? "All learning tools" : "Alle Lernwerkzeuge";
    const group = document.createElement("section");
    group.className = groupClass;
    const title = document.createElement(titleTag);
    title.className = titleClass;
    title.textContent = en ? "Learning tools" : "Lernwerkzeuge";
    group.append(title);
    for (const item of config.more) group.append(link(item, itemClass));
    group.append(link({ href: config.settings, label: en ? "Settings" : "Einstellungen" }, itemClass));
    const roadmap = link({ href: "/roadmap.html", label: en ? "Roadmap & improvements" : "Roadmap & Verbesserungen" }, itemClass);
    roadmap.hreflang = "fa";
    group.append(roadmap);
    more.append(summary, group);
    return more;
  };

  // Grammar lab pages: a fixed ".sidebar" with its own <nav>.
  const sidebar = document.querySelector(".sidebar");
  if (sidebar) {
    document.body.classList.add("language-workspace");
    const navigation = sidebar.querySelector("nav");
    if (navigation) {
      navigation.replaceChildren(buildPrimaryNav(), buildMore("nav-group", "h2", "nav-title", "nav-link"));
    }
    const actions = document.querySelector(".header-actions");
    if (actions) {
      const tools = document.createElement("details"); tools.className = "calm-header-tools";
      const summary = document.createElement("summary"); summary.textContent = en ? "Tools & help" : "Hilfe & Werkzeuge";
      actions.before(tools); tools.append(summary, actions);
    }
    return;
  }

  // Today pages: a ".side" drawer and a topbar of glyph buttons. Keep every
  // topbar button (handlers and drawer state live on them); only regroup them.
  const side = document.querySelector("nav.side");
  if (!side) return;
  document.body.classList.add("language-workspace", "daily-workspace");
  const body = side.querySelector(".side-body");
  if (body) body.replaceChildren(buildPrimaryNav(), buildMore("nav-section", "div", "nav-heading", "nav-item"));
  const topbar = document.querySelector(".topbar");
  if (topbar) {
    const keep = new Set([topbar.querySelector(".mobile-menu")]);
    const moved = [...topbar.children].filter((el) => !keep.has(el) && !el.classList.contains("roadmap-link") && !(el.classList.contains("pill") && el.querySelector(".dot")));
    if (moved.length) {
      const tools = document.createElement("details"); tools.className = "calm-header-tools";
      const summary = document.createElement("summary"); summary.textContent = en ? "Tools & help" : "Hilfe & Werkzeuge";
      const panel = document.createElement("div"); panel.className = "calm-tools-panel";
      panel.append(...moved);
      const roadmap = topbar.querySelector(".roadmap-link");
      if (roadmap) panel.append(roadmap);
      tools.append(summary, panel);
      topbar.append(tools);
    }
  }
});
