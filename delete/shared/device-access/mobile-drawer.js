/* Shared by the daily and grammar documents in both languages. */
window.createLanguageDrawer = function createLanguageDrawer(sidebar, trigger, existingBackdrop) {
  const mobile = window.matchMedia("(max-width: 820px)");
  const german = document.documentElement.lang === "de";
  const backdrop = existingBackdrop || document.createElement("div");
  if (!existingBackdrop) document.body.append(backdrop);
  backdrop.setAttribute("aria-hidden", "true");
  backdrop.style.cssText = "position:fixed;inset:0;background:#20143266;z-index:60;display:none";
  sidebar.style.zIndex = "61";
  const close = document.createElement("button");
  close.type = "button";
  close.className = "drawer-close";
  close.textContent = german ? "Menü schließen ×" : "Close menu ×";
  sidebar.prepend(close);
  trigger.setAttribute("aria-controls", sidebar.id);
  let savedOverflow = document.body.style.overflow;
  let open = false;

  function setDrawer(next, returnFocus = true) {
    const wasOpen = open;
    open = Boolean(next && mobile.matches);
    if (open && !wasOpen) savedOverflow = document.body.style.overflow;
    sidebar.classList.toggle("open", open);
    sidebar.inert = mobile.matches && !open;
    trigger.setAttribute("aria-expanded", String(open));
    backdrop.style.display = open ? "block" : "none";
    if (open) {
      sidebar.setAttribute("role", "dialog");
      sidebar.setAttribute("aria-modal", "true");
      document.body.style.overflow = "hidden";
      // Wait until the newly visible drawer participates in layout before
      // moving focus away from the trigger.
      requestAnimationFrame(() => { if (open) close.focus(); });
    } else {
      sidebar.removeAttribute("role");
      sidebar.removeAttribute("aria-modal");
      if (wasOpen) document.body.style.overflow = savedOverflow;
      if (wasOpen && returnFocus && mobile.matches) trigger.focus();
    }
  }
  trigger.addEventListener("click", () => setDrawer(!open));
  close.addEventListener("click", () => setDrawer(false));
  backdrop.addEventListener("click", () => setDrawer(false));
  document.addEventListener("keydown", (event) => {
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setDrawer(false);
    } else if (event.key === "Tab") {
      const focusable = [...sidebar.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),[tabindex="0"]')]
        .filter((element) => element.getBoundingClientRect().height > 0 && !element.closest("[inert]"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
  mobile.addEventListener("change", () => setDrawer(false, false));
  setDrawer(false, false);
  return setDrawer;
};
