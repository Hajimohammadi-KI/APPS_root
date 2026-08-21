"use client";

import { useEffect, useState } from "react";

type TooltipState = {
  text: string;
  top: number;
  left: number;
  placement: "above" | "below";
};

const exactHelp: Record<string, string> = {
  Heute: "داشبورد و مأموریت امروز را باز می‌کند.",
  Lernplan: "برنامهٔ کامل یادگیری و همهٔ هفته‌ها را نشان می‌دهد.",
  Kalender: "روزها و موعدهای برنامهٔ یادگیری را نمایش می‌دهد.",
  Bibliothek: "کتابخانه و ابزار مطالعهٔ PDF را باز می‌کند.",
  Fortschritt: "پیشرفت، ریتم مطالعه و شواهد انجام کار را نشان می‌دهد.",
  Einstellungen: "تنظیمات، اتصال‌ها، پشتیبان‌گیری و گزینه‌های دسترسی را باز می‌کند.",
  "PDF Visual": "PDF را برای انتخاب متن، یادداشت و علامت‌گذاری باز می‌کند.",
  Exposé: "نسخهٔ Exposé پروژه را در PDF Reader باز می‌کند.",
  "Fokus-Timer": "تایمر تمرکز برای کار فعلی را شروع می‌کند.",
};

function labelOf(element: HTMLElement): string {
  return (
    element.getAttribute("aria-label")?.trim() ||
    element.textContent?.replace(/\s+/g, " ").trim() ||
    ""
  );
}

function helpFor(element: HTMLElement): string {
  const label = labelOf(element);
  const exact = exactHelp[label];
  if (exact) return exact;
  if (element.matches("a")) return `این پیوند بخش «${label || "بعدی"}» را باز می‌کند.`;
  if (element.matches("button, [role='button']")) {
    return `این دکمه عمل «${label || "انتخاب"}» را اجرا می‌کند.`;
  }
  return "این بخش عنوان و هدف محتوای زیر را توضیح می‌دهد.";
}

function interactiveElements(root: Document | HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>("a, button, [role='button'], h1, h2, h3"),
  );
}

export default function PersianHoverHelp() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    const decorate = (root: Document | HTMLElement = document) => {
      for (const element of interactiveElements(root)) {
        element.dataset.persianTooltip = helpFor(element);
      }
    };

    const show = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const text = element.dataset.persianTooltip || helpFor(element);
      const tooltipWidth = Math.min(320, Math.max(180, window.innerWidth - 24));
      const halfWidth = tooltipWidth / 2;
      const left = Math.min(
        Math.max(12 + halfWidth, rect.left + rect.width / 2),
        window.innerWidth - 12 - halfWidth,
      );
      const placement = rect.bottom + 110 > window.innerHeight ? "above" : "below";
      const top = placement === "above" ? Math.max(12, rect.top - 10) : rect.bottom + 10;
      setTooltip({ text, top, left, placement });
    };

    const targetFrom = (event: Event) =>
      event.target instanceof Element
        ? event.target.closest<HTMLElement>("[data-persian-tooltip]")
        : null;

    const onPointerOver = (event: PointerEvent) => {
      const target = targetFrom(event);
      if (target) show(target);
    };
    const onPointerOut = (event: PointerEvent) => {
      const target = targetFrom(event);
      if (target && event.relatedTarget instanceof Node && target.contains(event.relatedTarget)) {
        return;
      }
      setTooltip(null);
    };
    const onFocusIn = (event: FocusEvent) => {
      const target = targetFrom(event);
      if (target) show(target);
    };
    const onFocusOut = () => setTooltip(null);

    decorate();
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof HTMLElement) {
            if (node.matches("a, button, [role='button'], h1, h2, h3")) {
              node.dataset.persianTooltip = helpFor(node);
            }
            decorate(node);
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("pointerout", onPointerOut);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    return () => {
      observer.disconnect();
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerout", onPointerOut);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  if (!tooltip) return null;

  return (
    <div
      className="persian-hover-tooltip"
      lang="fa"
      role="tooltip"
      data-placement={tooltip.placement}
      style={{ left: tooltip.left, top: tooltip.top }}
    >
      {tooltip.text}
    </div>
  );
}
