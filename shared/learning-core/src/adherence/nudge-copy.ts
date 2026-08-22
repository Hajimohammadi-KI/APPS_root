import type { ImplementationIntentionAction } from "./types";

export type NudgeLocale = "en" | "de" | "fa";

export interface NudgeCopy {
  readonly direction: "ltr" | "rtl";
  readonly settingsTitle: string;
  readonly optInLabel: string;
  readonly policy: string;
  readonly savedOn: string;
  readonly savedOff: string;
  readonly promptTitle: string;
  readonly promptBody: string;
  readonly start: string;
  readonly dismiss: string;
  readonly close: string;
  readonly actions: Readonly<Record<ImplementationIntentionAction, string>>;
}

export const NUDGE_COPY: Readonly<Record<NudgeLocale, NudgeCopy>> = {
  en: {
    direction: "ltr",
    settingsTitle: "Supportive in-app prompts",
    optInLabel:
      "Show an occasional prompt inside this app when one of my time plans matches.",
    policy:
      "Off by default. No push notification or email. Quiet hours, cooldowns, and daily and weekly limits always apply.",
    savedOn: "In-app prompts are on for this device.",
    savedOff: "In-app prompts are off. Nothing will appear.",
    promptTitle: "Your planned practice window is open",
    promptBody:
      "You planned to practise around now. Would a small start be useful?",
    start: "Open today’s practice",
    dismiss: "Not now — no penalty",
    close: "Close supportive prompt",
    actions: {
      full_session: "Open the full session",
      review_only: "Open a short review",
      booster: "Open a short booster",
      skip_ok: "No prompt needed",
    },
  },
  de: {
    direction: "ltr",
    settingsTitle: "Unterstützende Hinweise in der App",
    optInLabel:
      "Gelegentlich einen Hinweis in dieser App zeigen, wenn einer meiner Zeitpläne passt.",
    policy:
      "Standardmäßig aus. Keine Push-Nachricht und keine E-Mail. Ruhezeiten, Abstände sowie Tages- und Wochenlimits gelten immer.",
    savedOn: "Hinweise in der App sind für dieses Gerät eingeschaltet.",
    savedOff: "Hinweise in der App sind aus. Es wird nichts angezeigt.",
    promptTitle: "Dein geplantes Lernfenster ist geöffnet",
    promptBody:
      "Du wolltest ungefähr jetzt üben. Wäre ein kleiner Anfang hilfreich?",
    start: "Heutige Übung öffnen",
    dismiss: "Jetzt nicht — ohne Nachteil",
    close: "Unterstützenden Hinweis schließen",
    actions: {
      full_session: "Die ganze Einheit öffnen",
      review_only: "Eine kurze Wiederholung öffnen",
      booster: "Einen kurzen Booster öffnen",
      skip_ok: "Kein Hinweis nötig",
    },
  },
  fa: {
    direction: "rtl",
    settingsTitle: "یادآوری حمایتی داخل برنامه",
    optInLabel:
      "وقتی یکی از برنامه‌های زمانی من منطبق است، گاهی فقط داخل این برنامه یادآوری نشان داده شود.",
    policy:
      "به‌طور پیش‌فرض خاموش است. پیام پوش، ایمیل یا پیام بیرون از برنامه ارسال نمی‌شود و ساعت سکوت و محدودیت روزانه و هفتگی همیشه اعمال می‌شود.",
    savedOn: "یادآوری داخل برنامه برای این دستگاه روشن شد.",
    savedOff: "یادآوری داخل برنامه خاموش است و چیزی نمایش داده نمی‌شود.",
    promptTitle: "زمان برنامه‌ریزی‌شدهٔ تمرین شما رسیده است",
    promptBody:
      "برای حدود این زمان تمرین گذاشته بودید. آیا یک شروع کوتاه برایتان مفید است؟",
    start: "بازکردن تمرین امروز",
    dismiss: "الان نه — بدون جریمه",
    close: "بستن یادآوری حمایتی",
    actions: {
      full_session: "بازکردن تمرین کامل",
      review_only: "بازکردن مرور کوتاه",
      booster: "بازکردن تمرین تقویتی کوتاه",
      skip_ok: "نیازی به یادآوری نیست",
    },
  },
} as const;
