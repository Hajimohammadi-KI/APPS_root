/* Presentation only. Move existing controls so their handlers and stored state survive. */
document.addEventListener("DOMContentLoaded", () => {
  const en = document.documentElement.lang !== "de";
  const routes = [
    ["/", en ? "Home" : "Start"], ["/practice", en ? "My practice" : "Meine Übungen"],
    [en ? "/grammar" : "/grammatik", en ? "Grammar" : "Grammatik"],
    ["/studio", en ? "Conversation" : "Gespräche"],
    [en ? "/?screen=progress" : "/fortschritt", en ? "My progress" : "Mein Fortschritt"],
  ];
  const buildPrimaryNav = () => {
    const nav = document.createElement("nav");
    nav.className = "calm-primary-nav";
    nav.setAttribute("aria-label", en ? "Learning navigation" : "Lernnavigation");
    for (const [href, label] of routes) {
      const a = document.createElement("a"); a.href = href; a.textContent = label;
      if (location.pathname === href) a.setAttribute("aria-current", "page");
      nav.append(a);
    }
    return nav;
  };
  const wrapInMore = (container, children) => {
    const more = document.createElement("details"); more.className = "calm-nav-more";
    const summary = document.createElement("summary"); summary.textContent = en ? "All learning tools" : "Alle Lernwerkzeuge";
    more.append(summary, ...children);
    container.append(more);
    return more;
  };

  // Grammar lab pages: a fixed ".sidebar" with its own <nav>.
  const sidebar = document.querySelector(".sidebar");
  if (sidebar) {
    document.body.classList.add("language-workspace");
    const oldNavigation = sidebar.querySelector("nav");
    if (oldNavigation) {
      oldNavigation.before(buildPrimaryNav());
      const more = document.createElement("details"); more.className = "calm-nav-more";
      const summary = document.createElement("summary"); summary.textContent = en ? "All learning tools" : "Alle Lernwerkzeuge";
      oldNavigation.before(more); more.append(summary, oldNavigation);
    }
    const actions = document.querySelector(".header-actions");
    if (actions) {
      const tools = document.createElement("details"); tools.className = "calm-header-tools";
      const summary = document.createElement("summary"); summary.textContent = en ? "Tools & help" : "Hilfe & Werkzeuge";
      actions.before(tools); tools.append(summary, actions);
    }
    return;
  }

  // Today pages: a ".side" drawer made of ".nav-section" groups and a topbar of
  // glyph buttons. Keep every button (handlers and drawer state live on them);
  // only regroup them so the page reads as one calm navigation.
  const side = document.querySelector("nav.side");
  if (!side) return;
  document.body.classList.add("language-workspace", "daily-workspace");
  const body = side.querySelector(".side-body");
  if (body) {
    const sections = [...body.querySelectorAll(".nav-section")];
    // The current page already appears in the primary navigation; the old
    // entry for it in the grouped list would be a duplicate.
    for (const item of body.querySelectorAll(".nav-item[data-route]")) {
      if (routes.some(([href]) => href === item.dataset.route)) item.remove();
    }
    body.prepend(buildPrimaryNav());
    wrapInMore(body, sections.filter((section) => section.querySelector(".nav-item, .nav-parent[data-route]")));
    for (const section of sections) section.classList.remove("is-collapsed");
  }
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
