# NLP Literature Lab — برنامهٔ خواندن و استخراج دوره

## تصمیم Revision 2

از ۱۹ اوت تا ۷ سپتامبر ۲۰۲۶، هدف دوره فقط خواندن مقاله‌های مرتبط و استخراج
مطالب قابل‌استفاده در پایان‌نامه است. تمرین‌های فنی این بازه در برنامه دیده
می‌شوند، اما اختیاری‌اند و در درصد پیشرفت، عقب‌افتادگی یا streak محاسبه نمی‌شوند.

جلسه‌ها شنبه، دوشنبه و چهارشنبه، ساعت **۱۸:۰۰ تا ۱۹:۴۰ برلین** برگزار می‌شوند.
جلسهٔ اول در ۱۷ اوت گذشته است؛ در Google Calendar برای آن رویداد تازه‌ای ساخته
نمی‌شود.

## منابع

پوشهٔ قطعی مطالعه:

`D:\Bachelor-Thesis\02_Literature\09_NLP_Course_2026_Reading_Order`

این پوشه دقیقاً ۱۸ PDF یکتا دارد. پیشوند `C01` تا `C18` ترتیب فعلی مطالعه بر
اساس کلاس را نشان می‌دهد و `O06` تا `O23` شمارهٔ اصلی را حفظ می‌کند. مقالهٔ
`C01-O06` LogicLens در حال مطالعه است. فایل‌های اصلی جابه‌جا یا تغییرنام داده
نشده‌اند.

شیوهٔ خواندن از نام فایل پیروی می‌کند:

- `DEEP`: مقاله کامل، روش، ارزیابی و محدودیت‌ها.
- `TARGET`: بخش‌های Method، Evaluation، Metrics و Threats مرتبط.
- `REVIEW`: taxonomy، مقایسه‌ها و limitations.
- `RELATED`: چکیده، نمای کلی روش و نتیجه.

## فرم ثابت استخراج

برای هر مقاله این شش بخش تکمیل می‌شود:

1. Problem
2. Method
3. Data / Evaluation
4. Findings
5. Limitations
6. ارتباط دقیق با RQ/معماری پروژه

بخش ششم باید روشن کند مقاله به کدام قسمت مربوط است: RQ1، RQ2، Evidence Record،
Evidence Path، Flat Retrieval، Graph Retrieval یا Answerability.

## مرز معماری

مقاله می‌تواند یک تصمیم معماری یا روش ارزیابی را پشتیبانی کند، اما خروجی مدل،
attention weight یا similarity score به‌تنهایی Evidence نیست. ادعای repository
فقط با Evidence Record قابل‌ردیابی و Evidence Path معتبر تأیید می‌شود؛ نبود یا
تعارض شواهد باید به پاسخ `NOT_ANSWERABLE` یا پاسخ محدود منجر شود.

## ارتباط جلسه‌ها

- جلسه‌های ۱–۴: نمایش متن/کد، tokenization، retrieval واژگانی و embedding.
- جلسه‌های ۵–۶: جایگاه RNN/LSTM/GRU و دلیل خارج‌بودن پیاده‌سازی آن‌ها از هسته.
- جلسهٔ ۷: Seq2Seq، RAG و جداسازی حافظهٔ پارامتری از شواهد بازیابی‌شده.
- جلسهٔ ۸: attention هدایت‌شده با graph/data flow در برابر Evidence Path صریح.
- جلسهٔ ۹: encoder/decoder، BERT/GPT، repository QA و نقش‌های کاربر.
- جلسهٔ ۱۰: prompting، PEFT، RAG و مرز BLEU/ROUGE با معیارهای retrieval/evidence.

`READING-ORDER.md` نگاشت کامل مقاله‌ها و `EXTRACTION-NOTES.md` قالب آمادهٔ هر
۱۸ مقاله را نگه می‌دارند.
