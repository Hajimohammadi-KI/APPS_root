import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function wordCount(value: string) {
  return value.match(/\b[\p{L}\p{N}'’-]+\b/gu)?.length ?? 0;
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function formatSeconds(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function requiredFirst<T>(items: readonly T[], catalogName: string): T {
  const first = items[0];
  if (first === undefined) {
    throw new Error(`${catalogName} must not be empty.`);
  }
  return first;
}
