import type { AdherenceFeatureFlags } from "./types";

export const ADHERENCE_V1_SHADOW_FLAG = "adherence_v1_shadow" as const;

export const DEFAULT_ADHERENCE_FEATURE_FLAGS: Readonly<
  Required<AdherenceFeatureFlags>
> = {
  adherence_v1_shadow: false,
};

export function isAdherenceShadowEnabled(
  flags: AdherenceFeatureFlags,
): boolean {
  return flags.adherence_v1_shadow === true;
}
