document.addEventListener("DOMContentLoaded", () => {
  const host = document.querySelector(".hero-copy") ?? document.querySelector(".exercise-card");
  if (!host) return;
  const german = document.documentElement.lang === "de";
  const link = document.createElement("a");
  link.className = "learning-path-link";
  link.textContent = german ? "Eigenständigen Lernweg fortsetzen →" : "Continue independent learning path →";
  const update = () => {
    const context = new URLSearchParams(location.search);
    const query = new URLSearchParams();
    if (document.querySelector(".exercise-card")) {
      const topic = document.querySelector("#lessonTitle")?.textContent?.trim() || context.get("topic");
      const level = document.querySelector(".crumbs .badge")?.textContent?.trim() || context.get("level");
      if (topic) query.set("topic", topic);
      if (level) query.set("level", level);
    }
    link.href = query.size ? `/practice?${query}` : "/practice";
  };
  update();
  link.addEventListener("click", update);
  window.addEventListener("language-topic-changed", update);
  host.append(link);
});
