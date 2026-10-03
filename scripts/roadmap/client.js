(() => {
  "use strict";
  let snapshot = JSON.parse(
    document.getElementById("roadmap-data").textContent,
  );
  let expanded = false;
  const $ = (id) => document.getElementById(id);
  const escape = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  const labels = {
    planned: "Planned",
    in_progress: "In progress",
    implemented: "Implemented",
    verified: "Verified complete",
    blocked: "Blocked",
    deferred: "Deferred",
    removed: "Removed",
  };
  const engineering = (task) =>
    task.engineeringVerification === "verified_for_recorded_scope";
  const date = (value) =>
    new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  const badge = (task) =>
    `<span class="pill ${task.status === "verified" ? "good" : task.remainingEngineeringWork?.length || task.remainingHumanWork?.length || ["in_progress", "blocked"].includes(task.status) ? "warning" : "muted"}">${task.status === "verified" ? "✓ " : ""}${escape(task.remainingEngineeringWork?.length ? "Implementation still open" : task.remainingHumanWork?.length ? "Human validation pending" : labels[task.status])}</span>${engineering(task) && task.status !== "verified" ? '<span class="pill good">✓ Recorded checks passed</span>' : ""}`;
  const evidence = (paths) =>
    `<ul class="evidence">${paths.map((path) => `<li><code>${escape(path)}</code></li>`).join("")}</ul>`;
  function render() {
    const { backlog, history } = snapshot,
      tasks = backlog.tasks;
    const opened = new Set(
      [...document.querySelectorAll(".task[open]")].map((node) => node.id),
    );
    const required = tasks.filter((t) => t.required),
      complete = required.filter((t) => t.status === "verified").length;
    const implementationOpen = required.filter(
      (task) => task.remainingEngineeringWork?.length,
    );
    $("stats").innerHTML = [
      [
        complete + " / " + required.length,
        "Required tasks fully verified",
        "All completion criteria satisfied",
      ],
      [
        required.filter((t) => engineering(t) || t.status === "verified")
          .length +
          " / " +
          required.length,
        "Tasks with recorded engineering checks",
        "May cover only part of a task",
      ],
      [
        required.length - complete,
        "Required tasks still open",
        implementationOpen.length
          ? `${implementationOpen.length} also require implementation`
          : "See remaining steps on each card",
      ],
      [
        tasks.filter((t) => !t.required).length,
        "Conditional tasks",
        "Experiments and later decisions",
      ],
    ]
      .map(
        ([number, title, note]) =>
          `<div class="stat"><strong>${number}</strong><span>${title}</span><small>${note}</small></div>`,
      )
      .join("");
    $("completion-note").textContent =
      `${complete} of ${required.length} required tasks are fully verified. ${required.length - complete} required tasks and ${tasks.filter((task) => !task.required && task.status !== "verified").length} conditional tasks remain open. Green check badges cover the recorded tests only.${implementationOpen.length ? ` Required implementation still open: ${implementationOpen.map((task) => task.id).join(", ")}.` : ""}`;
    const release = backlog.technicalRelease;
    $("release").innerHTML =
      `<div><span class="pill ${release.status === "verified" ? "good" : "warning"}">${release.status === "verified" ? "✓ Technical release verified" : release.status === "blocked" ? "Desktop release blocked" : "Technical release pending"}</span><p><strong>${Object.entries(
        release.versions,
      )
        .map(([name, version]) => escape(name) + " " + escape(version))
        .join(" · ")}</strong></p>${
        release.installedVersions
          ? `<p>Installed and preserved: ${Object.entries(
              release.installedVersions,
            )
              .map(([name, version]) => escape(name) + " " + escape(version))
              .join(" · ")}</p>`
          : ""
      }${release.blocker ? `<p>${escape(release.blocker)}</p>` : ""}</div><div><p>Full curriculum: <span class="pill ${release.fullCurriculum === "not_qualified" ? "warning" : "muted"}">${escape(release.fullCurriculum.replaceAll("_", " "))}</span></p><p>Learner outcomes: <span class="pill muted">${escape(release.learnerOutcomes.replaceAll("_", " "))}</span></p></div>`;
    $("updated").textContent = "Updated " + date(snapshot.generatedAt);
    $("scope").textContent = backlog.scope;
    const phaseValue = $("phase").value;
    $("phase").innerHTML =
      '<option value="all">All phases</option>' +
      backlog.phases
        .map(
          (p) => `<option value="${escape(p.id)}">${escape(p.title)}</option>`,
        )
        .join("");
    $("phase").value = backlog.phases.some((p) => p.id === phaseValue)
      ? phaseValue
      : "all";
    const query = $("search").value.trim().toLowerCase(),
      filter = $("status").value;
    const visible = tasks.filter(
      (task) =>
        (!query ||
          [
            task.id,
            task.title,
            task.progressNote,
            task.deliverable,
            ...task.acceptance,
            ...(task.remainingEngineeringWork || []),
            ...(task.remainingHumanWork || []),
            ...(task.afterHumanValidation || []),
          ]
            .join(" ")
            .toLowerCase()
            .includes(query)) &&
        ($("phase").value === "all" || task.phase === $("phase").value) &&
        (filter === "all" ||
          (filter === "engineering"
            ? engineering(task) || task.status === "verified"
            : filter === "open"
              ? task.status !== "verified"
              : task.status === filter)),
    );
    $("results").textContent =
      `${visible.length} of ${tasks.length} tasks shown`;
    $("phases").innerHTML =
      backlog.phases
        .map((phase, index) => {
          const rows = visible.filter((t) => t.phase === phase.id);
          if (!rows.length) return "";
          return `<section class="phase"><div class="phase-title"><span class="phase-number">${String(index + 1).padStart(2, "0")}</span><div><h2>${escape(phase.title)}</h2><p>${escape(phase.exit)}</p></div></div>${rows.map((task) => `<details class="task" id="task-${escape(task.id)}" data-status="${task.status}" ${expanded || opened.has("task-" + task.id) ? "open" : ""}><summary><span class="task-id">${escape(task.id)}</span><span><span class="task-name">${escape(task.title)}</span><span class="badges">${badge(task)}<span class="pill">${escape(task.priority)} · ${task.required ? "Required" : "Conditional"}</span></span></span></summary><div class="task-body"><p>${escape(task.progressNote)}</p><h3>Deliverable</h3><p>${escape(task.deliverable)}</p><h3>Completion criteria</h3><ul>${task.acceptance.map((a) => `<li>${escape(a)}</li>`).join("")}</ul>${task.condition ? "<p><strong>Condition:</strong> " + escape(task.condition) + "</p>" : ""}${task.dependsOn.length ? `<h3>Depends on</h3><div class="deps">${task.dependsOn.map((id) => `<button type="button" data-task="${escape(id)}">${escape(id)} · ${escape(labels[tasks.find((t) => t.id === id)?.status] || "Unknown")}</button>`).join("")}</div>` : ""}<details><summary>Recorded evidence (${task.evidence.length})</summary>${evidence(task.evidence)}</details></div></details>`).join("")}</section>`;
        })
        .join("") ||
      '<p class="empty">No matching tasks. Try another search or filter.</p>';
    for (const task of visible) {
      const card = $("task-" + task.id);
      if (task.remainingHumanWork?.length)
        card.dataset.humanValidation = "pending";
      if (task.remainingEngineeringWork?.length)
        card.dataset.implementation = "pending";
      const lists = [
        ["Remaining implementation", task.remainingEngineeringWork],
        ["Remaining human validation", task.remainingHumanWork],
        ["Work after human evidence arrives", task.afterHumanValidation],
      ];
      const details = `${task.engineeringScope ? `<p><strong>Scope of passed checks:</strong> ${escape(task.engineeringScope)}</p>` : ""}${lists
        .filter(([, items]) => items?.length)
        .map(
          ([title, items]) =>
            `<h3>${escape(title)}</h3><ul>${items.map((item) => `<li>${escape(item)}</li>`).join("")}</ul>`,
        )
        .join("")}`;
      card
        .querySelector(".task-body > p")
        .insertAdjacentHTML("afterend", details);
    }
    $("history").innerHTML =
      [...history.changes]
        .reverse()
        .map(
          (change) =>
            `<article class="change ${change.to === "verified" || change.engineeringVerified ? "verified" : ""}"><small>${escape(date(change.at))} · ${escape(change.taskId)}</small><h3>${escape(change.title)}</h3><span class="pill ${change.to === "verified" ? "good" : "muted"}">${escape(change.from ? labels[change.from] + " → " + labels[change.to] : labels[change.to])}</span>${change.engineeringVerified ? ' <span class="pill good">✓ Recorded engineering scope verified</span>' : ""}<p>${escape(change.note)}</p><details><summary>Evidence at this change (${change.evidence.length})</summary>${evidence(change.evidence)}</details></article>`,
        )
        .join("") ||
      '<p class="empty">The current task states form the first snapshot. New changes will be recorded here automatically.</p>';
    $("baseline").textContent =
      "Journal started " +
      date(history.firstObservedAt) +
      ". Earlier completion dates are not reconstructed.";
    $("source").textContent =
      "Source: docs/language-automaticity-implementation-backlog.json · SHA-256 " +
      snapshot.sourceSha256;
  }
  function showTask(id) {
    $("search").value = "";
    $("status").value = "all";
    $("phase").value = "all";
    render();
    const task = $("task-" + id);
    if (task) {
      task.open = true;
      task.querySelector("summary").focus();
      task.scrollIntoView({ block: "center" });
    }
  }
  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-task]");
    if (target) showTask(target.dataset.task);
  });
  for (const id of ["search", "status", "phase"])
    $(id).addEventListener(id === "search" ? "input" : "change", render);
  $("expand").onclick = () => {
    expanded = !expanded;
    document.querySelectorAll(".task").forEach((t) => (t.open = expanded));
    $("expand").textContent = expanded ? "Collapse all" : "Expand all";
  };
  const live =
    location.protocol === "http:" &&
    ["127.0.0.1", "localhost"].includes(location.hostname);
  let refreshing = false;
  async function refresh() {
    if (!live) {
      location.reload();
      return;
    }
    if (refreshing) return;
    refreshing = true;
    try {
      const response = await fetch("/snapshot", {
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw Error("Live roadmap unavailable");
      const next = await response.json();
      if (next.refreshError) throw Error(next.refreshError);
      if (next.sourceSha256 !== snapshot.sourceSha256) {
        snapshot = next;
        render();
      }
      $("connection").textContent =
        "● Live · checks for updates every 3 seconds";
      $("error").hidden = true;
    } catch (error) {
      $("connection").textContent = "Showing last saved snapshot";
      $("error").hidden = false;
      $("error").textContent =
        "Automatic update paused: " +
        error.message +
        ". Your last roadmap is still visible.";
    } finally {
      refreshing = false;
    }
  }
  $("refresh").onclick = refresh;
  render();
  $("connection").textContent = live
    ? "Connecting to live updates…"
    : "Offline HTML snapshot";
  if (location.hash.startsWith("#task-"))
    showTask(decodeURIComponent(location.hash.slice(6)));
  if (live) {
    void refresh();
    setInterval(refresh, 3000);
  }
})();
