import { BookOpen, Headphones, Mic2, PenLine } from "lucide-react";
import type { CefrLevel, IntegratedSkill } from "@grammar/content";

export const skillMeta: Record<
  IntegratedSkill,
  {
    label: string;
    description: string;
    icon: typeof Headphones;
    className: string;
  }
> = {
  listening: {
    label: "Listening",
    description: "Understand, notice, recall, and explain",
    icon: Headphones,
    className: "border-worksheet-line! bg-worksheet-cyan! text-worksheet-teal!",
  },
  speaking: {
    label: "Speaking",
    description: "Repeat, reformulate, and speak without a script",
    icon: Mic2,
    className: "border-worksheet-line! bg-worksheet-cyan! text-worksheet-teal!",
  },
  reading: {
    label: "Reading",
    description: "Find meaning, evidence, and structure",
    icon: BookOpen,
    className: "border-worksheet-line! bg-worksheet-cyan! text-worksheet-teal!",
  },
  writing: {
    label: "Writing",
    description: "Build, revise, and transfer a clear message",
    icon: PenLine,
    className: "border-amber-300 bg-amber-50 text-amber-950",
  },
};

export const levelTone: Record<CefrLevel, string> = {
  A1: "border-worksheet-teal bg-worksheet-teal! border-worksheet-teal! text-white!",
  A2: "border-worksheet-teal bg-worksheet-teal! border-worksheet-teal! text-white!",
  B1: "border-worksheet-teal bg-worksheet-teal! border-worksheet-teal! text-white!",
  B2: "border-worksheet-teal bg-worksheet-teal! border-worksheet-teal! text-white!",
  C1: "border-slate-600 bg-slate-800 text-white",
  C2: "border-worksheet-teal bg-worksheet-ink! text-white!",
};
