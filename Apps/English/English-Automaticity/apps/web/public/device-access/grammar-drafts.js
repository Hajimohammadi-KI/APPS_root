/* Per-question drafts are included in the language app's complete backup. */
window.createGrammarDrafts = ({ language, answer, intent, onError }) => {
  let key = null;
  let assisted = false;
  let readable = true;
  const save = () => {
    if (!key) return;
    try {
      if (!readable) throw new Error("Unreadable original draft");
      const value = JSON.stringify({ answer: answer.value, intent: intent?.value ?? "", assisted });
      localStorage.setItem(key, value);
      if (localStorage.getItem(key) !== value) throw new Error("Draft write failed");
    } catch { onError(); }
  };
  answer.addEventListener("input", save);
  intent?.addEventListener("input", save);
  return {
    load(identity) {
      key = `automaticity:v2:${language}:grammar-draft:${encodeURIComponent(identity)}`;
      assisted = false;
      readable = true;
      answer.value = "";
      if (intent) intent.value = "";
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return;
        const draft = JSON.parse(raw);
        if (!draft || typeof draft.answer !== "string" || typeof draft.intent !== "string" || typeof draft.assisted !== "boolean") throw new Error("Invalid draft");
        answer.value = draft.answer;
        if (intent) intent.value = draft.intent;
        assisted = draft.assisted;
      } catch { readable = false; onError(); }
    },
    get assisted() { return assisted; },
    markAssisted() { assisted = true; save(); },
    save,
  };
};
