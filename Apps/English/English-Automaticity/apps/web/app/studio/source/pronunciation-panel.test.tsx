import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { PronunciationPanel, PronunciationResult } from "./pronunciation-panel";

test("local audio workflow starts without uploading audio or inventing a transcript", () => {
  const html = renderToStaticMarkup(
    <PronunciationPanel
      audioBlob={null}
      audioUrl={null}
      recordingVersion={0}
      recordingBusy={false}
      variant="en-US"
    />,
  );
  expect(html).toContain("Pronunciation from recording");
  expect(html).toContain("Words you intended to say");
  expect(html).toContain("Load local speech model");
  expect(html).toContain("Analyze sounds on this device");
  expect(html).not.toContain("Azure");
  expect(html).not.toContain("Hello");
  expect(html).not.toContain("Pronunciation score");
});

test("local estimated phonemes retain acoustic differences without a corrected word or grade", () => {
  const html = renderToStaticMarkup(
    <PronunciationResult
      observation={{
        source: "local_phoneme_model",
        modelId: "hama-js@1.7.0/asr-v3",
        phonemes: ["h", "ɑ", "l", "oʊ"],
        spans: [{ phoneme: "ɑ", startMs: 200, endMs: 300 }],
        durationMs: 1000,
        pronunciationScore: null,
        verified: false,
      }}
      onReplay={() => {}}
    />,
  );
  expect(html).toContain("/h ɑ l oʊ/");
  expect(html).toContain("Replay this sound");
  expect(html).toContain("experimental");
  expect(html).not.toContain("Hello");
  expect(html).not.toContain("Correct pronunciation");
  expect(html).not.toContain("Pronunciation score");
});

test("studio audio never constructs browser recognition or posts recording to a remote API", () => {
  const recorder = readFileSync(
    new URL("./use-studio-recorder.ts", import.meta.url),
    "utf8",
  );
  const panel = readFileSync(
    new URL("./pronunciation-panel.tsx", import.meta.url),
    "utf8",
  );
  expect(recorder).not.toMatch(
    /recognitionConstructor|startSpeechRecognition|new Recognition\(/,
  );
  expect(panel).not.toContain("/api/conversation/pronunciation");
  expect(panel).not.toContain("new FormData");
  expect(panel).not.toContain("Microsoft Azure");
});

test("a direct Studio visit includes the shared offline installation lifecycle", () => {
  const studio = readFileSync(
    new URL("./studio-source.tsx", import.meta.url),
    "utf8",
  );
  expect(studio).toContain("<AppUpdateNotice />");
});
