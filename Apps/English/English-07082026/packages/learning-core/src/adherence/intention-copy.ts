import type {
  ImplementationIntentionAction,
  ImplementationIntentionTrigger,
} from "./types";

export type ImplementationIntentionLocale = "en" | "de" | "fa";

export interface ImplementationIntentionCopy {
  readonly direction: "ltr" | "rtl";
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly add: string;
  readonly save: string;
  readonly skip: string;
  readonly remove: string;
  readonly active: string;
  readonly trigger: string;
  readonly triggerValue: string;
  readonly action: string;
  readonly privacy: string;
  readonly countError: string;
  readonly labelError: string;
  readonly saved: string;
  readonly skipped: string;
  readonly triggers: Readonly<Record<ImplementationIntentionTrigger, string>>;
  readonly actions: Readonly<Record<ImplementationIntentionAction, string>>;
}

export const IMPLEMENTATION_INTENTION_COPY: Readonly<
  Record<ImplementationIntentionLocale, ImplementationIntentionCopy>
> = {
  en: {
    direction: "ltr",
    eyebrow: "Optional setup · about 1 minute",
    title: "My if–then practice plans",
    description:
      "Choose 2–5 situations that can help you start. You can skip, disable, or delete them without any penalty.",
    add: "Add a plan",
    save: "Save plans on this device",
    skip: "Skip for now",
    remove: "Delete plan",
    active: "Active",
    trigger: "If this happens",
    triggerValue: "Time or short situation",
    action: "Then I will",
    privacy:
      "These plans stay only on this device and are never sent or used to diagnose you.",
    countError: "Save either no active plans or 2–5 active plans.",
    labelError: "Every plan needs a valid time or short situation.",
    saved: "Plans saved locally. No reminder was sent.",
    skipped: "Skipped. Nothing was saved and there is no penalty.",
    triggers: {
      time: "At a time",
      after_event: "After an event",
      context: "In a context",
      feeling: "When I feel",
    },
    actions: {
      full_session: "Do the full session",
      review_only: "Review only",
      booster: "Do a short booster",
      skip_ok: "Choose that skipping is okay",
    },
  },
  de: {
    direction: "ltr",
    eyebrow: "Optionale Einrichtung · etwa 1 Minute",
    title: "Meine Wenn-dann-Lernpläne",
    description:
      "Wähle 2–5 Situationen, die dir beim Start helfen können. Überspringen, Deaktivieren und Löschen haben keine Nachteile.",
    add: "Plan hinzufügen",
    save: "Pläne auf diesem Gerät speichern",
    skip: "Jetzt überspringen",
    remove: "Plan löschen",
    active: "Aktiv",
    trigger: "Wenn das passiert",
    triggerValue: "Uhrzeit oder kurze Situation",
    action: "Dann werde ich",
    privacy:
      "Diese Pläne bleiben nur auf diesem Gerät und werden nie gesendet oder für eine Diagnose verwendet.",
    countError: "Speichere entweder keinen oder 2–5 aktive Pläne.",
    labelError: "Jeder Plan braucht eine gültige Uhrzeit oder kurze Situation.",
    saved: "Pläne lokal gespeichert. Es wurde keine Erinnerung gesendet.",
    skipped:
      "Übersprungen. Nichts wurde gespeichert und es gibt keinen Nachteil.",
    triggers: {
      time: "Zu einer Uhrzeit",
      after_event: "Nach einem Ereignis",
      context: "In einer Situation",
      feeling: "Wenn ich mich so fühle",
    },
    actions: {
      full_session: "die ganze Einheit machen",
      review_only: "nur wiederholen",
      booster: "einen kurzen Booster machen",
      skip_ok: "entscheiden, dass Auslassen okay ist",
    },
  },
  fa: {
    direction: "rtl",
    eyebrow: "تنظیم اختیاری · حدود یک دقیقه",
    title: "برنامه‌های اگر–آنگاه من",
    description:
      "۲ تا ۵ موقعیت را انتخاب کنید که می‌توانند به شروع تمرین کمک کنند. ردکردن، غیرفعال‌کردن یا حذف هیچ جریمه‌ای ندارد.",
    add: "افزودن برنامه",
    save: "ذخیره روی همین دستگاه",
    skip: "فعلاً رد شود",
    remove: "حذف برنامه",
    active: "فعال",
    trigger: "اگر این اتفاق افتاد",
    triggerValue: "زمان یا موقعیت کوتاه",
    action: "آنگاه من",
    privacy:
      "این برنامه‌ها فقط روی همین دستگاه می‌مانند و هرگز ارسال یا برای تشخیص پزشکی استفاده نمی‌شوند.",
    countError: "هیچ برنامهٔ فعالی یا ۲ تا ۵ برنامهٔ فعال ذخیره کنید.",
    labelError: "هر برنامه به یک زمان معتبر یا موقعیت کوتاه نیاز دارد.",
    saved: "برنامه‌ها محلی ذخیره شدند. هیچ یادآوری ارسال نشد.",
    skipped: "رد شد. چیزی ذخیره نشد و هیچ جریمه‌ای وجود ندارد.",
    triggers: {
      time: "در یک زمان",
      after_event: "پس از یک رویداد",
      context: "در یک موقعیت",
      feeling: "وقتی چنین احساسی دارم",
    },
    actions: {
      full_session: "تمرین کامل را انجام می‌دهم",
      review_only: "فقط مرور می‌کنم",
      booster: "یک تمرین تقویتی کوتاه انجام می‌دهم",
      skip_ok: "می‌پذیرم که ردکردن اشکالی ندارد",
    },
  },
} as const;
