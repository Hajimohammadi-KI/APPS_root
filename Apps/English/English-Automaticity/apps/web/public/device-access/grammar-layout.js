/* The topic picker is compact on phones without hiding search results. */
document.addEventListener("DOMContentLoaded", () => {
  const catalog = document.querySelector(".catalog");
  const toggle = document.getElementById("catalogToggle");
  const results = document.getElementById("catalogContents");
  if (!catalog || !toggle || !results) return;
  const setOpen = (open) => {
    results.hidden = !open;
    toggle.setAttribute("aria-expanded", String(!results.hidden));
  };
  toggle.addEventListener("click", () => {
    setOpen(results.hidden);
    if (!results.hidden) document.getElementById("topicSearch")?.focus();
  });
  catalog.addEventListener("click", (event) => {
    if (!event.target.closest(".topic")) return;
    window.dispatchEvent(new Event("language-topic-changed"));
    {
      setOpen(false);
      const prompt = document.getElementById("exercisePrompt");
      if (prompt) { prompt.tabIndex = -1; prompt.focus({preventScroll:true}); prompt.scrollIntoView({block:"center",behavior:"instant"}); }
    }
  });
  setOpen(false);
});
