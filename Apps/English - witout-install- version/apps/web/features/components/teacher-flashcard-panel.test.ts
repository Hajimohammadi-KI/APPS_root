import { describe, expect, it } from "bun:test";

import { parseBatchLine } from "./teacher-flashcard-panel";

describe("parseBatchLine", () => {
	it("parses a front|back line", () => {
		expect(parseBatchLine("run | to run")).toEqual({ front: "run", back: "to run" });
	});

	it("parses a front|back|sentence line", () => {
		expect(parseBatchLine("ate | past of eat | She ate breakfast early.")).toEqual({
			front: "ate",
			back: "past of eat",
			originalSentence: "She ate breakfast early.",
		});
	});

	it("returns null when front is missing", () => {
		expect(parseBatchLine(" | to run")).toBeNull();
	});

	it("returns null when back is missing", () => {
		expect(parseBatchLine("run |  ")).toBeNull();
	});

	it("returns null for a line with no separator", () => {
		expect(parseBatchLine("just some text")).toBeNull();
	});

	it("trims whitespace around each field", () => {
		expect(parseBatchLine("  run   |   to run   ")).toEqual({ front: "run", back: "to run" });
	});
});
