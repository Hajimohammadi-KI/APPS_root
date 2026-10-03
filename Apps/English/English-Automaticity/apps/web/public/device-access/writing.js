/* Keep Persian instructions and Latin examples in distinct reading directions. */
(() => {
  const containsPersian = (text) => /[\u0600-\u06ff]/u.test(text);
  function parts(text, language) {
    const value = String(text ?? "");
    if (!containsPersian(value)) return [{ text: value, lang: language, dir: "ltr", example: false }];
    return value.split(/([\p{Script=Latin}][\p{Script=Latin}\p{M}\p{N}\s.,!?;:'"„“”’()/_—–-]*)/gu)
      .filter((part) => part.trim())
      .map((part) => ({
        text: part.trim(),
        lang: containsPersian(part) ? "fa" : language === "fa" ? "de" : language,
        dir: containsPersian(part) ? "rtl" : "ltr",
        example: !containsPersian(part),
      }));
  }
  function render(element, text, language) {
    if (!element) return;
    element.lang = language;
    element.dir = language === "fa" ? "rtl" : "ltr";
    element.replaceChildren();
    for (const part of parts(text, language)) {
      const span = document.createElement("span");
      span.textContent = part.text;
      span.lang = part.lang;
      span.dir = part.dir;
      span.className = part.example ? "prompt-example" : "prompt-instruction";
      element.append(span);
    }
  }
  window.languageWriting = { parts, render };
})();
