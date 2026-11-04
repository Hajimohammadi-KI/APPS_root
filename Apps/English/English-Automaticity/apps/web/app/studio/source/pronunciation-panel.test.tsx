import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PronunciationPanel, PronunciationResult } from "./pronunciation-panel";

test("audio checking starts with an empty explicit target, unchecked consent and no invented result", () => {
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
  expect(html).toContain("Send this recording to Microsoft Azure Speech");
  expect(html).not.toContain('checked=""');
  expect(html).not.toContain("Hello");
  expect(html).not.toContain("Pronunciation score");
});

test("identical recognized spelling retains a different acoustic candidate without a grade", () => {
  const html = renderToStaticMarkup(
    <PronunciationResult
      observation={{
        kind: "audio_observation",
        provider: "Microsoft Azure Speech",
        variant: "en-US",
        referenceText: "Hello.",
        recognizedText: "Hello.",
        spokenPhonemesAvailable: true,
        words: [
          {
            word: "Hello",
            offsetSeconds: 0,
            durationSeconds: 1,
            phonemes: [
              {
                expected: "ə",
                heard: "ɑ",
                offsetSeconds: 0.2,
                durationSeconds: 0.1,
              },
            ],
          },
        ],
        pronunciationScore: null,
        verified: false,
      }}
      onReplay={() => {}}
    />,
  );
  expect(html).toContain("/ə/");
  expect(html).toContain("/ɑ/");
  expect(html).toContain("Replay this word");
  expect(html).toContain("model observations");
  expect(html).not.toContain("Correct pronunciation");
  expect(html).not.toContain("Pronunciation score");
});
