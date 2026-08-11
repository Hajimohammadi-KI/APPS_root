declare module "bun:test" {
  type ExpectValue = { [method: string]: (...args: unknown[]) => unknown };
  export function describe(name: string, callback: () => void): void;
  export function test(name: string, callback: () => void): void;
  export const expect: ((value: unknown) => ExpectValue) & { any: (constructor: unknown) => unknown };
}
