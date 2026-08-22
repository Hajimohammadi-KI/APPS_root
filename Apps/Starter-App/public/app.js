const grid = document.querySelector("#apps");
const startAllButton = document.querySelector("#start-all");
const icons = { english: "EN", german: "DE", tracker: "CR", settings: "ST", pdf: "PDF" };

async function requestStatus() {
  const response = await fetch("/api/status", { cache: "no-store" });
  if (!response.ok) throw new Error("Status could not be loaded");
  return response.json();
}

function render(apps) {
  grid.innerHTML = Object.entries(apps).map(([id, app], index) => `
    <article class="app-card ${index === 0 ? "wide" : ""}" id="${id}">
      <div class="app-top">
        <div class="app-title"><span class="app-icon">${icons[id]}</span><div><h2>${app.name}</h2><p>${app.description}</p></div></div>
        <span class="status ${app.ready ? "online" : ""}">${app.ready ? "Ready" : (app.running ? "Unavailable" : "Stopped")}</span>
      </div>
      <div class="services">${app.services.map(service => `<span class="service ${service.running ? "online" : ""}">Port ${service.port} · ${service.running ? "online" : "offline"}</span>`).join("")}</div>
      <div class="actions">
        <button class="action" data-start="${id}">${app.ready ? "Check and open" : "Start app"}</button>
        <button class="action open" data-open="${app.url}" ${app.ready ? "" : "disabled"}>Open</button>
      </div>
    </article>`).join("");
  const values = Object.values(apps);
  document.querySelector("#online-count").textContent = values.filter(app => app.ready).length;
  document.querySelector("#service-count").textContent = values.flatMap(app => app.services).filter(service => service.running).length;
}

async function refresh() {
  try { render(await requestStatus()); }
  catch (error) { grid.innerHTML = `<p>${error.message}</p>`; }
}

grid.addEventListener("click", async event => {
  const start = event.target.closest("[data-start]");
  const open = event.target.closest("[data-open]");
  if (open) return window.open(open.dataset.open, "_blank", "noopener");
  if (!start) return;
  start.disabled = true; start.textContent = "Starting…";
  const response = await fetch(`/api/start/${start.dataset.start}`, { method: "POST" });
  const result = await response.json();
  await refresh();
  if (result.url && result.ready) window.open(result.url, "_blank", "noopener");
  else alert(result.health?.error || result.error || "The app did not become ready. Check the Starter logs.");
});

startAllButton.addEventListener("click", async () => {
  startAllButton.disabled = true; startAllButton.textContent = "Starting all…";
  await fetch("/api/start-all", { method: "POST" });
  await refresh();
  startAllButton.disabled = false; startAllButton.textContent = "Start all apps";
});
document.querySelector("#refresh").addEventListener("click", refresh);
refresh();
setInterval(refresh, 8000);

