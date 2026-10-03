/* Device ink is a private draft. It is never submitted as an assessed answer. */
(() => {

  const WIDTH = 1000,
    HEIGHT = 400;
  const validStrokes = (value) =>
    Array.isArray(value)
      ? value
          .filter(
            (s) =>
              Array.isArray(s) &&
              s.length &&
              s.every(
                (p) =>
                  Number.isFinite(p.x) &&
                  Number.isFinite(p.y) &&
                  Number.isFinite(p.p),
              ),
          )
          .slice(0, 1500)
      : [];
  function draw(canvas, strokes) {
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.scale(canvas.width / WIDTH, canvas.height / HEIGHT);
    context.strokeStyle = context.fillStyle = "#172344";
    context.lineCap = context.lineJoin = "round";
    for (const stroke of strokes) {
      stroke.forEach((point, index) => {
        context.lineWidth = 1.8 + point.p * 3.8;
        if (!index) {
          context.beginPath();
          context.arc(point.x, point.y, context.lineWidth / 2, 0, Math.PI * 2);
          context.fill();
        } else {
          context.beginPath();
          context.moveTo(stroke[index - 1].x, stroke[index - 1].y);
          context.lineTo(point.x, point.y);
          context.stroke();
        }
      });
    }
    context.restore();
  }
  function mount(root, options) {
    const en = options.language === "en";
    const text = (de, english) => (en ? english : de);
    const cleanup = [];
    let dialog,
      fieldId,
      strokes = [],
      history = [],
      erasing = false,
      pointer = null,
      current,
      previousFocus;
    const preview = (field) => {
      const canvas = field.querySelector(".ws-ink-preview");
      const data = validStrokes(options.get(`${field.dataset.inkField}:ink`));
      canvas.hidden = !data.length;
      draw(canvas, data);
    };
    const save = () => {
      options.set(`${fieldId}:ink`, strokes);
      root.querySelectorAll("[data-ink-field]").forEach(preview);
    };
    const close = () => {
      if (!dialog) return;
      if (pointer !== null) {
        pointer = null;
        save();
      }
      dialog.close();
      dialog.remove();
      dialog = undefined;
      document.body.classList.remove("ws-inking");
      previousFocus?.focus();
    };
    const distance = (p, a, b) => {
      const dx = b.x - a.x,
        dy = b.y - a.y;
      const t = Math.max(
        0,
        Math.min(
          1,
          ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1),
        ),
      );
      return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
    };
    function open(field) {
      close();
      previousFocus = document.activeElement;
      fieldId = field.dataset.inkField;
      strokes = structuredClone(validStrokes(options.get(`${fieldId}:ink`)));
      history = [];
      erasing = false;
      pointer = null;
      dialog = document.createElement("dialog");
      dialog.className = "ws-ink-dialog";
      dialog.setAttribute("aria-labelledby", "ws-ink-title");
      dialog.innerHTML = `<div class="ws-ink-heading"><h2 id="ws-ink-title"></h2><button type="button" data-ink-close>${text("Fertig", "Done")}</button></div><p>${text("Mit Stift, Finger oder Maus schreiben. Zum Scrollen außerhalb der Schreibfläche wischen.", "Write with a pen, finger or mouse. Swipe outside the pad to scroll.")}</p><div class="ws-ink-tools"><button type="button" data-ink-pen aria-pressed="true">${text("Stift", "Pen")}</button><button type="button" data-ink-erase aria-pressed="false">${text("Strichradierer", "Stroke eraser")}</button><button type="button" data-ink-undo>${text("Rückgängig", "Undo")}</button><button type="button" data-ink-clear>${text("Leeren", "Clear")}</button></div><canvas class="ws-ink-pad" width="1500" height="600" role="img"></canvas><p class="ws-ink-message" role="status">${text("Handschrift bleibt als Zeichnung erhalten. Keine automatische Bewertung.", "Handwriting is saved as a drawing. It is not automatically graded.")}</p>`;
      dialog.querySelector("h2").textContent = field
        .querySelector("textarea")
        .getAttribute("aria-label");
      const context = field
        .closest(".ws-exercise, .ws-personal, .ws-oral-prompt, .ws-recall")
        ?.querySelector(".ws-prompt, p, strong");
      if (context) {
        const prompt = document.createElement("p");
        prompt.className = "ws-ink-context";
        prompt.textContent = context.textContent;
        dialog.querySelector(".ws-ink-heading").after(prompt);
      }
      const canvas = dialog.querySelector("canvas");
      canvas.setAttribute(
        "aria-label",
        text(
          "Schreibfläche; alternativ im Antwortfeld tippen",
          "Writing pad; alternatively type in the answer field",
        ),
      );
      const redraw = () => {
        draw(canvas, strokes);
        dialog.querySelector("[data-ink-undo]").disabled = !history.length;
        dialog.querySelector("[data-ink-clear]").disabled = !strokes.length;
      };
      const point = (event) => {
        const rect = canvas.getBoundingClientRect();
        return {
          x: Math.max(
            0,
            Math.min(WIDTH, ((event.clientX - rect.left) / rect.width) * WIDTH),
          ),
          y: Math.max(
            0,
            Math.min(
              HEIGHT,
              ((event.clientY - rect.top) / rect.height) * HEIGHT,
            ),
          ),
          p: Math.max(0.1, Math.min(1, event.pressure || 0.5)),
        };
      };
      const append = (event) => {
        const samples = event.getCoalescedEvents?.() || [];
        for (const sample of samples.length ? samples : [event]) {
          const p = point(sample);
          if (erasing || event.buttons & 32)
            strokes = strokes.filter(
              (s) => !s.some((a, i) => distance(p, a, s[i + 1] || a) < 18),
            );
          else current.push(p);
        }
        redraw();
      };
      canvas.addEventListener("pointerdown", (event) => {
        // One captured pointer rejects incidental touches while the pen is writing.
        if (
          pointer !== null ||
          (event.pointerType === "mouse" && event.button !== 0)
        )
          return;
        event.preventDefault();
        pointer = event.pointerId;
        history.push(structuredClone(strokes));
        if (history.length > 30) history.shift();
        current = [];
        if (!erasing && !(event.buttons & 32)) strokes.push(current);
        canvas.setPointerCapture(pointer);
        append(event);
      });
      canvas.addEventListener("pointermove", (event) => {
        if (event.pointerId === pointer) {
          event.preventDefault();
          append(event);
        }
      });
      const finish = (event) => {
        if (event.pointerId !== pointer) return;
        const captured = pointer;
        pointer = null;
        if (canvas.hasPointerCapture(captured))
          canvas.releasePointerCapture(captured);
        strokes = strokes.filter((s) => s.length);
        save();
        redraw();
      };
      ["pointerup", "pointercancel", "lostpointercapture"].forEach((name) =>
        canvas.addEventListener(name, finish),
      );
      dialog.querySelector("[data-ink-close]").onclick = close;
      dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        close();
      });
      for (const mode of ["pen", "erase"])
        dialog.querySelector(`[data-ink-${mode}]`).onclick = () => {
          erasing = mode === "erase";
          dialog
            .querySelector("[data-ink-pen]")
            .setAttribute("aria-pressed", String(!erasing));
          dialog
            .querySelector("[data-ink-erase]")
            .setAttribute("aria-pressed", String(erasing));
        };
      dialog.querySelector("[data-ink-undo]").onclick = () => {
        if (history.length) {
          strokes = history.pop();
          save();
          redraw();
        }
      };
      dialog.querySelector("[data-ink-clear]").onclick = () => {
        history.push(structuredClone(strokes));
        strokes = [];
        save();
        redraw();
      };
      document.body.append(dialog);
      document.body.classList.add("ws-inking");
      dialog.showModal();
      redraw();
    }
    root.querySelectorAll("[data-ink-field]").forEach((field) => {
      const button = field.querySelector("[data-ink-open]");
      const handler = () => open(field);
      button.addEventListener("click", handler);
      cleanup.push(() => button.removeEventListener("click", handler));
      preview(field);
    });
    const flush = () => {
      if (dialog) save();
    };
    window.addEventListener("pagehide", flush);
    return () => {
      close();
      cleanup.forEach((fn) => fn());
      window.removeEventListener("pagehide", flush);
    };
  }
  window.GrammarWorksheetInk = { mount };
})();
