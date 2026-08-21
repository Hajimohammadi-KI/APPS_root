import { runAdherenceShadow } from "./shadow-runner";

const browserAdapter = Object.freeze({ runAdherenceShadow });

Object.defineProperty(globalThis, "AutomaticityAdherenceShadow", {
  configurable: false,
  enumerable: false,
  writable: false,
  value: browserAdapter,
});

export { runAdherenceShadow };
