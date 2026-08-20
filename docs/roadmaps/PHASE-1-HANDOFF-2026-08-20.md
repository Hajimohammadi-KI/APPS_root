# فاز ۱ — چک‌لیست مشترک Claude/Codex — ضرب‌الاجل فردا ۲۰۲۶-۰۸-۲۱

سند هماهنگی مشترک. **هم Claude هم Codex این فایل را قبل از شروع کار روی
app-shell/navigation/home در English یا Deutsch بخوانند و بعد از هر تغییر
واقعی، بخش «وضعیت» را همین‌جا آپدیت کنند** — نه فقط در حافظهٔ خودشان.
سند کامل‌تر (۹ فاز، بلندمدت): `docs/roadmaps/UX-SIMPLIFICATION-ROADMAP-2026-08-20.md`.

## هدف فاز ۱ (فقط همین، نه بیشتر)

بازآرایی ناوبری هر دو اپ به یک ساختار ۶ آیتمی، بدون داده یا backend جدید:

1. **Start / Startseite** — همیشه بیرون از Dropdown
2. **Today / Heute**
3. **Practice ▾** — Mixed Training · Conversation Studio · Review
4. **Learn ▾** — Grammar · Vocabulary · PDF Reader
5. **Progress ▾** — Learning Evidence · Repair Items · Statistics
6. **Settings ▾**

معیار پذیرش: در صفحهٔ Home فقط **یک CTA غالب** دیده شود (نه چند دکمهٔ شروع
رقیب)، و دکمهٔ Home از همهٔ صفحات در دسترس باشد.

## وضعیت لحظه‌ای (بررسی‌شده در ۲۰۲۶-۰۸-۲۰، ساعت ~۲۳:۲۰)

`git status` نشان می‌دهد این فایل‌ها **همین الان تغییر یافته و commit نشده‌اند** —
احتمالاً توسط Codex، در حال انجام:

| اپ | فایل | نقش در فاز ۱ |
|---|---|---|
| English | `apps/web/features/app-shell.tsx` | shell/navigation اصلی |
| English | `apps/web/features/screens/mission-home-screen.tsx` | صفحهٔ Home |
| English | `apps/web/features/components/daily-automaticity-program.tsx` (جدید) | احتمالاً بخشی از Today/session |
| Deutsch | `apps/web/src/components/app-shell.tsx` | shell/navigation اصلی |
| Deutsch | `apps/web/src/components/mobile-navigation.tsx` | منوی موبایل |
| Deutsch | `apps/web/src/lib/navigation.ts` | تعریف route/منو |
| Deutsch | `apps/web/src/features/dashboard/mission-home.tsx` | صفحهٔ Home |

**نتیجه:** قبل از این‌که Claude همین فایل‌ها را دوباره بنویسد، باید معلوم شود
Codex دقیقاً چه چیزی را تغییر داده. تا آن زمان Claude این فایل‌ها را دست
نمی‌زند تا تغییرات Codex overwrite نشود.

## تقسیم کار پیشنهادی (برای جلوگیری از تداخل)

- **Codex ادامه بدهد** روی همین ۷ فایل بالا (چون از قبل شروع کرده).
- **Claude** بعد از اعلام آماده‌بودن Codex برای هرکدام: `typecheck` + `test`
  + `build` را روی همان اپ اجرا می‌کند، نتیجه را همین‌جا ثبت می‌کند، و اگر
  چیزی معیار پذیرش را نقض کند (مثلاً چند CTA رقیب هنوز روی Home) مشخص
  می‌کند — نه این‌که کد را از نو بنویسد.
- اگر Codex فایلی را کامل کرد و آزاد کرد (commit شد یا صراحتاً اعلام شد)،
  همین‌جا زیر عنوان «آزاد شد» علامت بزند تا نفر بعدی بداند دست‌زدن ایمن است.

## وضعیت فاز ۱ به تفکیک اپ

| اپ | وضعیت | آخرین بروزرسانی |
|---|---|---|
| English | 🟡 در حال ویرایش (احتمالاً Codex، commit نشده) | ۲۰۲۶-۰۸-۲۰ |
| Deutsch | 🟡 در حال ویرایش (احتمالاً Codex، commit نشده) | ۲۰۲۶-۰۸-۲۰ |

## گام بعدی که Claude همین الان می‌تواند انجام بدهد بدون تداخل

- آماده برای اجرای `typecheck`/`test`/`build` روی هر اپ به محض این‌که یکی
  از فایل‌های بالا به یک نقطهٔ پایدار برسد (چه توسط Codex چه توسط کاربر
  اعلام شود).
- آماده برای تطبیق نتیجهٔ نهایی با معیار پذیرش بالا (۶ آیتم منو + یک CTA
  در Home) و گزارش دقیق مغایرت‌ها با file:line.

## تاریخچهٔ بروزرسانی

- **۲۰۲۶-۰۸-۲۰ ~۲۳:۲۰** — Claude: سند ایجاد شد. مشاهده شد که Codex از قبل
  روی ۷ فایل ناوبری/Home هر دو اپ کار می‌کند (uncommitted). ضرب‌الاجل کاربر:
  فردا ۲۰۲۶-۰۸-۲۱.
