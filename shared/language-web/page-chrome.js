/* Presentation only. Move existing controls so their handlers and stored state survive. */
document.addEventListener("DOMContentLoaded", () => {
  const en = document.documentElement.lang !== "de";
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;
  document.body.classList.add("language-workspace");
  const oldNavigation = sidebar.querySelector("nav");
  if (oldNavigation) {
    const nav = document.createElement("nav");
    nav.className = "calm-primary-nav";
    nav.setAttribute("aria-label", en ? "Learning navigation" : "Lernnavigation");
    const routes = [
      ["/", en ? "Home" : "Start"], ["/practice", en ? "My practice" : "Meine Übungen"],
      [en ? "/grammar" : "/grammatik", en ? "Grammar" : "Grammatik"],
      ["/studio", en ? "Conversation" : "Gespräche"],
      [en ? "/?screen=progress" : "/fortschritt", en ? "My progress" : "Mein Fortschritt"],
    ];
    for (const [href, label] of routes) {
      const a = document.createElement("a"); a.href = href; a.textContent = label;
      if (location.pathname === href) a.setAttribute("aria-current", "page");
      nav.append(a);
    }
    oldNavigation.before(nav);
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
});
