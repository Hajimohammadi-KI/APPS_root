export type PdfReaderState = {
  page: number;
  selectedText: string;
  selectedPage: number;
  question: string;
  answer: string;
  translation: string;
  updatedAt: string;
};

const MAX_TEXT_LENGTH = 28_000;
const MAX_RESULT_LENGTH = 48_000;

function boundedString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.slice(0, maxLength) : "";
}

function positivePage(value: unknown) {
  const page = typeof value === "number" ? value : Number(value);
  return Number.isInteger(page) && page > 0 && page <= 100_000 ? page : 1;
}

export function sanitizePdfReaderState(value: unknown): PdfReaderState {
  const item = value && typeof value === "object" ? value as Partial<PdfReaderState> : {};
  return {
    page: positivePage(item.page),
    selectedText: boundedString(item.selectedText, MAX_TEXT_LENGTH),
    selectedPage: positivePage(item.selectedPage),
    question: boundedString(item.question, 2_000),
    answer: boundedString(item.answer, MAX_RESULT_LENGTH),
    translation: boundedString(item.translation, MAX_RESULT_LENGTH),
    updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : new Date(0).toISOString(),
  };
}

export function sanitizePdfReaderStateStore(value: unknown): Record<string, PdfReaderState> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key.length > 0 && key.length <= 240)
      .map(([key, entry]) => [key, sanitizePdfReaderState(entry)]),
  );
}

