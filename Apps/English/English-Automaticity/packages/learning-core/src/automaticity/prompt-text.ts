import type { Language } from "./contracts";

/** Keep every character, while giving Persian and Latin text their own direction. */
export function promptTextParts(text: string, language: Language) {
  const hasPersian = (value: string) => /[\p{Script=Arabic}]/u.test(value);
  const parts = hasPersian(text)
    ? text.split(
        /([\p{Script=Latin}][\p{Script=Latin}\p{M}\p{N}\s.,!?;:'"„“”’()/_—–-]*)/gu,
      )
    : [text];
  return parts.filter(Boolean).map((part) => ({
    text: part,
    lang: hasPersian(part) ? "fa" : language,
    dir: hasPersian(part) ? "rtl" : "ltr",
  }));
}
