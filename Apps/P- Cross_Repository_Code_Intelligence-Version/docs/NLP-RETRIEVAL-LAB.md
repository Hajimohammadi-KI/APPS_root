# NLP Retrieval Lab — نقشهٔ کامل دوره تا ماژول پروژه

## تصمیم محصول

این دوره به یک اپ بزرگ و جدا از پایان‌نامه تبدیل نمی‌شود. خروجی آن یک ماژول
مستقل و قابل جداسازی به نام **NLP Retrieval Lab** است که اکنون از مسیر
`/nlp-lab` باز می‌شود. رابط کاربری و اتصال اصلی با Bun/TypeScript است؛ تمرین‌های
کلاس می‌توانند در Notebookهای Python باقی بمانند. فقط آزمایشی که معیارهای کیفیت
را عبور کند وارد کد اصلی می‌شود.

## تعریف مسئله

ورودی سیستم یک Corpus ثابت از چند repository و یک سؤال زبان طبیعی است. Lab باید
یک فهرست top-k قابل بازتولید از candidateهای کد برگرداند. هر candidate باید score،
شناسه، SourceLocation و Evidence ID قابل پیگیری داشته باشد. Lab اجازه ندارد فقط
با شباهت متن ادعا را صحیح اعلام کند؛ تصمیم نهایی `SUPPORTED`،
`PARTIALLY_SUPPORTED` یا `NOT_ANSWERABLE` متعلق به Verifier برنامهٔ Cross است.

## ارتباط با سؤال پژوهش

- Flat baseline: tokenizer مخصوص کد + TF-IDF + cosine + top-k.
- Graph baseline: candidateها و pathهای حاصل از Neo4j.
- مقایسهٔ RQ2: هر دو روش با Corpus، سؤال‌ها و k یکسان اجرا می‌شوند.
- معیارهای اصلی: Recall@k، MRR، Evidence Completeness، Path Validity، Correct
  Refusal و latency.
- ROUGE و BLEU فقط معیارهای فرعی متن تولیدشده‌اند و جای Evidence را نمی‌گیرند.

## محدوده

### Core تا ۷ سپتامبر

1. Tokenization و preprocessing مخصوص C#.
2. Flat retriever قابل بازتولید با TF-IDF و cosine.
3. قراردادهای `QuestionContract` و `RetrievalRun`.
4. Fixture و تست deterministic.
5. export نتیجه برای Evaluation و Cross app.
6. تفکیک قطعی ranking، evidence و answerability.

### Optional experiment

- FastText یا encoder embedding فقط برای جدول مقایسه.
- BERT/GraphCodeBERT فقط بعد از وجود Flat baseline و dataset ثابت.
- RAG فقط بعد از Retriever و Verifier؛ هر پاسخ باید Evidence ID داشته باشد.

### منبع رسمی LLM

- [Google Machine Learning Crash Course — Introduction to Large Language Models](https://developers.google.com/machine-learning/crash-course/llm)
  برای جلسهٔ BERT، GPT و Prompt Engineering استفاده می‌شود. هنگام مطالعه،
  تفاوت میان token/context/self-attention و Evidence قابل‌ردیابی پروژه ثبت شود؛
  خروجی احتمالی مدل به‌تنهایی مدرک محسوب نمی‌شود.

### Future Work

- آموزش RNN/LSTM/GRU برای هستهٔ پایان‌نامه.
- LoRA/QLoRA بدون dataset ارزیابی‌شده.
- cloud sync، حساب چندکاربره و fine-tuning production.
- تلقی attention weight یا similarity score به‌عنوان Evidence.

## Use Caseها

### UC-01 — ساخت index

- Actor: Researcher.
- Input: `CorpusManifest` و repositoryهای frozen.
- Main flow: استخراج token، حفظ SourceLocation، ساخت vocabulary و index.
- Failure: فایل غیرقابل‌خواندن، encoding نامعتبر، duplicate identity.
- Output: index نسخه‌دار + گزارش tokenization.

### UC-02 — بازیابی top-k

- Actor: Developer/Architect/QA.
- Input: `QuestionContract` و `RetrievalConfig`.
- Main flow: query vector، cosine ranking، tie-break قطعی، top-k.
- Failure: سؤال نامعتبر، index ناسازگار، candidate صفر.
- Output: candidateها با score و SourceLocation.

### UC-03 — مقایسهٔ Flat و Graph

- Actor: Researcher.
- Input: همان سؤال‌ها، Corpus و k.
- Main flow: اجرای هر دو retriever، محاسبهٔ Recall@k/MRR و ذخیره RunId.
- Output: جدول مقایسه و دادهٔ خام قابل بازتولید.

### UC-04 — بررسی Evidence

- Actor: QA reviewer.
- Main flow: بازکردن candidate، SourceLocation و Evidence ID؛ رد candidate فاقد
  provenance.
- Output: verdict و دلیل قابل audit.

### UC-05 — پاسخ یا امتناع صحیح

- Actor: Developer/Architect/QA.
- Main flow: Verifier فقط claimهای پوشش‌داده‌شده را تأیید می‌کند.
- Alternative: evidence ناقص یا متناقض → `NOT_ANSWERABLE` یا
  `PARTIALLY_SUPPORTED`.

### UC-06 — اتصال به Cross app

- Actor: Cross app.
- Input: `RetrievalRun` نسخه‌دار.
- Main flow: validate schema، نمایش candidate/evidence، ذخیره analysis result.
- Failure: schema version نامعتبر یا Evidence ID ناشناخته.

## معماری قابل جداسازی

```text
Python notebooks / experiments
            |
            v
NLP Retrieval Lab core
Tokenizer -> Flat Index -> Ranker -> Metrics
            |
            v
RetrievalRun JSON contract
            |
            v
Cross app adapter -> Evidence Verifier -> UI / Evaluation
```

مرز مهم: Python برای یادگیری و experiment مجاز است؛ Cross app به Notebook وابسته
نمی‌شود. اتصال نهایی فقط از طریق JSON schema و fixtureهای ثابت انجام می‌شود.

## اسناد مهندسی نرم‌افزار موردنیاز

1. `problem-statement.md`
2. `stakeholders-and-personas.md`
3. `use-cases.md`
4. `functional-requirements.yaml`
5. `quality-attribute-scenarios.md`
6. `c4-context.mmd` و `c4-container.mmd`
7. `question-contract.schema.json`
8. `retrieval-run.schema.json`
9. ADR برای tokenizer، Flat baseline، embedding و integration
10. `test-strategy.md`
11. `rq2-experiment-protocol.md`
12. `traceability-matrix.csv`

## روش خواندن مقاله

برای هر مقاله فقط این شش مورد ثبت شود:

1. مسئله و unit of analysis چیست؟
2. ورودی، خروجی و dataset چیست؟
3. baseline و metric چیست؟
4. Evidence یا provenance چگونه تعریف شده است؟
5. کدام تصمیم پروژه را تغییر می‌دهد؟
6. یک limitation که باید در پایان‌نامه ذکر شود چیست؟

خواندن کامل مقاله فقط برای منابع Core لازم است. منابع Course برای فهم مفهوم و
منابع Optional فقط برای جدول مقایسه استفاده می‌شوند.

## Gate اتصال نهایی

اتصال Lab به Cross app فقط وقتی انجام می‌شود که:

- tokenizer تست‌های source-span را پاس کند؛
- top-k با config یکسان deterministic باشد؛
- `RetrievalRun` schema و نمونهٔ معتبر/نامعتبر داشته باشد؛
- حداقل یک مقایسه Flat در برابر Graph اجرا شود؛
- هر claim دارای Evidence ID باشد یا پاسخ به‌درستی رد شود؛
- build و test هر دو بخش مستقل پاس شوند.

اگر این Gate تا ۷ سپتامبر کامل نشود، Lab مستقل می‌ماند و فقط خروجی JSON دستی
تولید می‌کند؛ پایان‌نامه به integration ناتمام وابسته نمی‌شود.

## سلامت و زمان‌بندی

دوره در ده جلسه از ۱۷ اوت تا ۷ سپتامبر، شنبه/دوشنبه/چهارشنبه، ساعت
۱۷:۳۰–۱۹:۱۰ برلین برگزار می‌شود. ۱۰ سپتامبر روز عمل است: هیچ task، catch-up،
deadline یا ازبین‌رفتن streak مجاز نیست. بازگشت فقط مطابق وضعیت شخصی و توصیهٔ
پزشک است.
