"use client";

import { useEffect, useState } from "react";
import {
  watchLearningPath,
  type LearningPathSelection,
} from "@automaticity/learning-core/automaticity";

/** Read the shared recommendation without turning a suggestion into a saved choice. */
export function useLearningPath(): LearningPathSelection | null {
  const [selection, setSelection] = useState<LearningPathSelection | null>(
    null,
  );
  useEffect(() => watchLearningPath("de", setSelection), []);
  return selection;
}
