export interface SemanticVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

const SEMANTIC_VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function parseSemanticVersion(value: string): SemanticVersion {
  const match = SEMANTIC_VERSION_PATTERN.exec(value);
  if (!match) {
    throw new Error(`Invalid semantic version: ${value}`);
  }

  return Object.freeze({
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  });
}

export function compareSemanticVersions(left: string, right: string): number {
  const a = parseSemanticVersion(left);
  const b = parseSemanticVersion(right);
  return a.major - b.major || a.minor - b.minor || a.patch - b.patch;
}
