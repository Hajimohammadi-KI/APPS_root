"use client";

import * as React from "react";

const TOOLTIP_ID = "english-automaticity-persian-help";

const exactHelp: Record<string, string> = {
  Home: "نمای کلی یادگیری و پیشنهاد بعدی را باز می‌کند.",
  "Daily Training":
    "تمرین‌های برنامه‌ریزی‌شدهٔ امروز را به ترتیب باز می‌کند.",
  "Conversation Studio":
    "برای تمرین گفت‌وگوی آزاد، ضبط صدا و اصلاح پاسخ استفاده می‌شود.",
  "Automaticity Path":
    "مراحل تبدیل دانسته‌های گرامری به کاربرد سریع و خودکار را نشان می‌دهد.",
  "Grammar Lab":
    "همهٔ موضوع‌های گرامری، توضیح‌ها و تمرین‌های آن‌ها را باز می‌کند.",
  "Q: Skills":
    "درس‌های چهار مهارت Q: Skills را بر اساس سطح و واحد نشان می‌دهد.",
  Resources: "منابع معتبر و تمرین‌های تکمیلی را نمایش می‌دهد.",
  "Error Workshop":
    "خطاهای ذخیره‌شده و تمرین‌های اصلاحی زمان‌بندی‌شده را باز می‌کند.",
  "Audio Library": "ضبط‌های صوتی ذخیره‌شده و پیشرفت گفتاری را نشان می‌دهد.",
  Settings:
    "تنظیمات یادگیری، دسترس‌پذیری، حریم خصوصی و پشتیبان‌گیری را باز می‌کند.",
  Help: "راهنمای کوتاه استفاده از برنامه را باز می‌کند.",
  "Read aloud": "متن صفحه را با صدای سیستم می‌خواند.",
  Install: "راهنمای نصب برنامه روی این دستگاه را باز می‌کند.",
  Save: "تغییرهای فعلی را در همین دستگاه ذخیره می‌کند.",
  Cancel: "این پنجره را بدون ثبت تغییر جدید می‌بندد.",
  Back: "به مرحله یا صفحهٔ قبلی برمی‌گردد.",
  Continue: "به مرحله یا صفحهٔ بعدی می‌رود.",
  Start: "تمرین یا فعالیت انتخاب‌شده را شروع می‌کند.",
  Check: "پاسخ شما را بر اساس هدف همین تمرین بررسی می‌کند.",
  Repeat: "این مطلب را دوباره برای تثبیت یادگیری تمرین می‌کند.",
  Delete: "مورد انتخاب‌شده را پس از تأیید حذف می‌کند.",
};

const partialHelp: ReadonlyArray<readonly [string, string]> = [
  ["level", "سطح انتخابی و شواهد لازم برای پیشرفت را مدیریت می‌کند."],
  ["speaking", "تمرین یا مدرک مربوط به صحبت‌کردن را باز یا ثبت می‌کند."],
  ["writing", "تمرین یا مدرک مربوط به نوشتن را باز یا ثبت می‌کند."],
  ["grammar", "محتوا یا تمرین مربوط به گرامر را نشان می‌دهد."],
  ["audio", "ضبط یا فایل صوتی مربوط را پخش، ذخیره یا مدیریت می‌کند."],
  ["error", "خطا و مسیر اصلاح آن را نشان می‌دهد."],
  ["progress", "پیشرفت ثبت‌شده و مرحلهٔ بعدی را نشان می‌دهد."],
  ["search", "در محتوای همین بخش جست‌وجو می‌کند."],
  ["filter", "موارد نمایش‌داده‌شده را محدود می‌کند."],
  ["open", "بخش یا مورد انتخاب‌شده را باز می‌کند."],
];

type HelpKind =
  | "button"
  | "link"
  | "input"
  | "checkbox"
  | "label"
  | "heading"
  | "text"
  | "box";

const candidateSelector = [
  "[data-persian-help]",
  "button",
  "a[href]",
  "input",
  "textarea",
  "select",
  "label",
  "legend",
  "summary",
  "h1",
  "h2",
  "h3",
  "h4",
  "p",
  "li",
  "th",
  "td",
  '[role="button"]',
  '[role="menuitem"]',
  '[data-slot="card"]',
  '[data-slot="field"]',
  '[data-slot="empty"]',
  '[data-slot="accordion-item"]',
  ".learning-accordion",
  ".metric-card",
  "section[aria-label]",
  "article[aria-label]",
].join(",");

const interactiveSelector = [
  "[data-persian-help]",
  "button",
  "a[href]",
  "input",
  "textarea",
  "select",
  "label",
  "summary",
  '[role="button"]',
  '[role="menuitem"]',
].join(",");

function kindOf(element: HTMLElement): HelpKind {
  if (
    element instanceof HTMLButtonElement ||
    element.getAttribute("role") === "button"
  ) {
    return "button";
  }
  if (element instanceof HTMLAnchorElement) return "link";
  if (element instanceof HTMLInputElement) {
    return element.type === "checkbox" || element.type === "radio"
      ? "checkbox"
      : "input";
  }
  if (
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    return "input";
  }
  if (element.matches("label, legend")) return "label";
  if (element.matches("h1, h2, h3, h4")) return "heading";
  if (
    element.matches(
      '[data-slot="card"], [data-slot="field"], [data-slot="empty"], [data-slot="accordion-item"], .learning-accordion, .metric-card, section[aria-label], article[aria-label]',
    )
  ) {
    return "box";
  }
  return "text";
}

function labelOf(element: HTMLElement, kind: HelpKind) {
  const formLabel =
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
      ? [...(element.labels ?? [])]
          .map((label) => label.textContent ?? "")
          .join(" ")
      : "";
  const boxHeading =
    kind === "box"
      ? element
          .querySelector<HTMLElement>("h1, h2, h3, h4, legend")
          ?.textContent?.trim() ?? ""
      : "";

  return (
    element.getAttribute("aria-label")?.trim() ||
    formLabel.trim() ||
    boxHeading ||
    element.textContent?.replace(/\s+/g, " ").trim() ||
    element.getAttribute("placeholder")?.trim() ||
    element.dataset.originalHoverTitle?.trim() ||
    ""
  );
}

function helpFor(label: string, kind: HelpKind) {
  const normalized = label.replace(/\s+/g, " ").trim();
  const excerpt = normalized.slice(0, 105);
  const exact = Object.entries(exactHelp).find(([key]) =>
    normalized.toLocaleLowerCase("de").startsWith(key.toLocaleLowerCase("de")),
  );
  if (exact) return exact[1];
  const partial = partialHelp.find(([key]) =>
    normalized.toLocaleLowerCase("de").includes(key),
  );
  if (partial) return partial[1];

  if (kind === "button") {
    return excerpt
      ? `این دکمه عمل «${excerpt}» را اجرا می‌کند.`
      : "این دکمه عمل مربوط را اجرا می‌کند.";
  }
  if (kind === "link") {
    return excerpt
      ? `این پیوند بخش یا منبع «${excerpt}» را باز می‌کند.`
      : "این پیوند بخش مربوط را باز می‌کند.";
  }
  if (kind === "input") {
    return excerpt
      ? `اطلاعات مربوط به «${excerpt}» را اینجا وارد یا انتخاب می‌کنید.`
      : "اطلاعات مربوط را اینجا وارد یا انتخاب می‌کنید.";
  }
  if (kind === "checkbox") {
    return excerpt
      ? `گزینهٔ «${excerpt}» را فعال یا غیرفعال می‌کند.`
      : "این گزینه را فعال یا غیرفعال می‌کند.";
  }
  if (kind === "label") {
    return excerpt
      ? `این برچسب موضوع فیلد «${excerpt}» را مشخص می‌کند.`
      : "این برچسب موضوع فیلد کنار خود را مشخص می‌کند.";
  }
  if (kind === "heading") {
    return excerpt
      ? `این عنوان بخش «${excerpt}» را معرفی می‌کند.`
      : "این عنوان موضوع بخش زیر را معرفی می‌کند.";
  }
  if (kind === "box") {
    return excerpt
      ? `این کادر اطلاعات و گزینه‌های «${excerpt}» را گروه‌بندی می‌کند.`
      : "این کادر اطلاعات مرتبط را گروه‌بندی می‌کند.";
  }
  return excerpt
    ? `این متن دربارهٔ «${excerpt}» توضیح می‌دهد.`
    : "این متن توضیح بخش فعلی است.";
}

function prepare(root: ParentNode) {
  const elements =
    root instanceof HTMLElement && root.matches(candidateSelector)
      ? [root, ...root.querySelectorAll<HTMLElement>(candidateSelector)]
      : [...root.querySelectorAll<HTMLElement>(candidateSelector)];

  for (const element of elements) {
    if (!element.dataset.originalHoverTitle && element.title) {
      element.dataset.originalHoverTitle = element.title;
      element.removeAttribute("title");
    }
    const kind = kindOf(element);
    element.dataset.persianTooltip =
      element.dataset.persianHelp ?? helpFor(labelOf(element, kind), kind);
  }
}

function targetElement(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  const element =
    target.closest(interactiveSelector) ?? target.closest(candidateSelector);
  if (!(element instanceof HTMLElement) || element.closest(`#${TOOLTIP_ID}`)) {
    return null;
  }
  return element;
}

export function PersianHoverHelp() {
  const [tooltip, setTooltip] = React.useState<{
    text: string;
    left: number;
    top: number;
    above: boolean;
  } | null>(null);

  React.useEffect(() => {
    prepare(document);
    const show = (element: HTMLElement) => {
      prepare(element);
      const text = element.dataset.persianTooltip;
      if (!text) return;
      const rect = element.getBoundingClientRect();
      setTooltip({
        text,
        left: Math.min(
          Math.max(rect.left + rect.width / 2, 176),
          Math.max(176, window.innerWidth - 176),
        ),
        top:
          rect.bottom > window.innerHeight * 0.68
            ? rect.top - 10
            : rect.bottom + 10,
        above: rect.bottom > window.innerHeight * 0.68,
      });
    };
    const hide = () => setTooltip(null);
    const pointerOver = (event: PointerEvent) => {
      const element = targetElement(event.target);
      if (element) show(element);
    };
    const focusIn = (event: FocusEvent) => {
      const element = targetElement(event.target);
      if (element) show(element);
    };
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof HTMLElement) prepare(node);
        }
      }
    });

    document.addEventListener("pointerover", pointerOver, true);
    document.addEventListener("pointerout", hide, true);
    document.addEventListener("focusin", focusIn, true);
    document.addEventListener("focusout", hide, true);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      document.removeEventListener("pointerover", pointerOver, true);
      document.removeEventListener("pointerout", hide, true);
      document.removeEventListener("focusin", focusIn, true);
      document.removeEventListener("focusout", hide, true);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, []);

  if (!tooltip) return null;

  return (
    <div
      className="pointer-events-none fixed z-50 max-w-[min(22rem,calc(100vw-1.5rem))] rounded-xl border border-primary/20 bg-card px-3.5 py-2.5 text-right text-sm leading-6 text-card-foreground shadow-xl"
      dir="rtl"
      id={TOOLTIP_ID}
      lang="fa"
      role="tooltip"
      style={{
        left: tooltip.left,
        top: tooltip.top,
        transform: tooltip.above
          ? "translate(-50%, -100%)"
          : "translateX(-50%)",
      }}
    >
      {tooltip.text}
    </div>
  );
}
