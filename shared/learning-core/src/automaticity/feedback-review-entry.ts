import { normalizeText } from "../text";
import type {
  LearnerFeedback,
  LearnerFeedbackCategory,
  LearnerFeedbackDecisionKind,
} from "./learner-feedback";

/** The owner's review page for learner comments. Learner text is only ever
 * set as text content. The key stays in this tab's session storage. */
const ENDPOINT = "/api/learner-feedback/review";
const KEY = "automaticity:learner-feedback-review-key";
interface Item {
  number: number;
  url: string | null;
  createdAt: string;
  feedback: LearnerFeedback;
}
const categories: Record<LearnerFeedbackCategory, string> = {
  answer_correct: "یادگیرنده: پاسخم درست است",
  feedback_unclear: "یادگیرنده: بازخورد را نمی‌فهمم",
  exercise_wrong: "یادگیرنده: تمرین ایراد دارد",
  other: "یادگیرنده: موضوع دیگر",
};
const decisions: [LearnerFeedbackDecisionKind, string][] = [
  ["accept_answer", "پاسخ درست است؛ به پاسخ‌های قابل قبول افزوده شود"],
  ["known_wrong", "این شکل غلط است؛ با توضیح برای یادگیرندگان بعدی"],
  ["fix_exercise", "خودِ تمرین ایراد دارد و باید بازنویسی شود"],
  ["no_change", "بدون تغییر"],
];
function node<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
  dir?: "ltr" | "rtl",
) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (dir) el.dir = dir;
  return el;
}
function sessionKey(): string {
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}
async function call(key: string, body?: unknown) {
  const response = await fetch(ENDPOINT, {
    method: body ? "POST" : "GET",
    headers: { "x-review-key": key, "content-type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });
  const json = (await response.json().catch(() => ({}))) as {
    error?: string;
    items?: Item[];
  };
  if (!response.ok) throw Error(json.error ?? `HTTP ${response.status}`);
  return json;
}

function mount(root: HTMLElement) {
  const keyInput = node("input"),
    load = node("button", "بارگذاری کامنت‌ها"),
    status = node("p"),
    list = node("div");
  keyInput.type = "password";
  keyInput.autocomplete = "off";
  keyInput.placeholder = "کلید بازبینی (LEARNER_FEEDBACK_REVIEW_KEY)";
  keyInput.value = sessionKey();
  keyInput.dir = "ltr";
  load.type = "button";
  status.setAttribute("role", "status");
  root.append(keyInput, load, status, list);
  const render = (items: Item[], key: string) => {
    list.replaceChildren();
    status.textContent = items.length
      ? `${items.length} کامنت باز`
      : "هیچ کامنت بازی نیست.";
    const byTask = new Map<string, Item[]>();
    for (const item of items) {
      const id = `${item.feedback.language} · ${item.feedback.task.id}`;
      byTask.set(id, [...(byTask.get(id) ?? []), item]);
    }
    for (const [id, rows] of byTask) {
      const section = node("section");
      const first = rows[0]!.feedback;
      section.append(
        node("h2", id, "ltr"),
        node("p", first.task.prompt, "ltr"),
        node(
          "p",
          `پاسخ‌های ذخیره‌شده: ${first.task.acceptedAnswers.join(" | ")}`,
        ),
      );
      const repeats = new Map<string, number>();
      for (const row of rows) {
        const answer = normalizeText(row.feedback.response).toLocaleLowerCase();
        repeats.set(answer, (repeats.get(answer) ?? 0) + 1);
      }
      for (const item of rows) section.append(card(item, key, repeats));
      list.append(section);
    }
  };
  const card = (item: Item, key: string, repeats: Map<string, number>) => {
    const { feedback } = item;
    const box = node("article");
    const count =
      repeats.get(normalizeText(feedback.response).toLocaleLowerCase()) ?? 1;
    box.append(
      node(
        "p",
        `#${item.number} · ${item.createdAt.slice(0, 10)} · ${categories[feedback.category]}${count > 1 ? ` · همین پاسخ ${count} بار` : ""}`,
      ),
      node("p", `پاسخ یادگیرنده: ${feedback.response}`, "ltr"),
      node(
        "p",
        `بررسی اپ: ${feedback.check.verdict} — ${feedback.check.feedback}`,
        "ltr",
      ),
    );
    if (feedback.comment)
      box.append(node("p", `کامنت: ${feedback.comment}`, "ltr"));
    if (item.url) {
      const link = node("a", "مشاهده در GitHub");
      link.href = item.url;
      link.rel = "noreferrer";
      box.append(link);
    }
    const choice = node("select"),
      answer = node("input"),
      explanation = node("textarea"),
      reply = node("textarea"),
      save = node("button", "ثبت تصمیم"),
      result = node("p");
    for (const [value, label] of decisions) {
      const option = node("option", label);
      option.value = value;
      choice.append(option);
    }
    answer.value = feedback.response;
    answer.dir = explanation.dir = reply.dir = "ltr";
    answer.style.width = explanation.style.width = reply.style.width = "100%";
    explanation.placeholder = `توضیح کوتاه به ${feedback.language === "en" ? "انگلیسی" : "آلمانی"} برای یادگیرندگانی که همین شکل غلط را می‌نویسند`;
    reply.placeholder = `پاسخ اختیاری به همین یادگیرنده، به ${feedback.language === "en" ? "انگلیسی" : "آلمانی"}`;
    save.type = "button";
    result.setAttribute("role", "status");
    const fields = node("div");
    const sync = () => {
      const kind = choice.value;
      fields.replaceChildren();
      if (kind === "accept_answer" || kind === "known_wrong")
        fields.append(node("label", "شکل دقیق پاسخ"), answer);
      if (kind === "known_wrong")
        fields.append(node("label", "توضیح (لازم)"), explanation);
      fields.append(node("label", "پاسخ به یادگیرنده"), reply);
    };
    choice.onchange = sync;
    sync();
    save.onclick = async () => {
      save.disabled = true;
      result.textContent = "در حال ثبت…";
      try {
        await call(key, {
          issue: item.number,
          decision: choice.value,
          answer: answer.value,
          explanation: explanation.value,
          reply: reply.value,
        });
        result.textContent =
          "ثبت شد. برای اعمال در تمرین‌ها: bun scripts/import-learner-decisions.ts و سپس build و انتشار.";
        choice.disabled =
          answer.disabled =
          explanation.disabled =
          reply.disabled =
            true;
      } catch (error) {
        result.textContent = `ثبت نشد: ${error instanceof Error ? error.message : error}`;
        save.disabled = false;
      }
    };
    box.append(choice, fields, save, result);
    return box;
  };
  load.onclick = async () => {
    const key = keyInput.value.trim();
    status.textContent = "در حال بارگذاری…";
    try {
      const { items = [] } = await call(key);
      try {
        sessionStorage.setItem(KEY, key);
      } catch {
        /* The key is then asked again in the next tab. */
      }
      render(items, key);
    } catch (error) {
      list.replaceChildren();
      status.textContent = `بارگذاری نشد: ${error instanceof Error ? error.message : error}`;
    }
  };
}

const root = document.getElementById("feedback-review");
if (root) mount(root);
