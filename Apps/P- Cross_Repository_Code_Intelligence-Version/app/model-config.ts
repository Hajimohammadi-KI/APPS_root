// Single source of truth lives in lib/model-config.ts; this re-export keeps the
// existing `app/`-relative imports working without a second copy of the value.
export { DEFAULT_OPENAI_MODEL } from "../lib/model-config";
