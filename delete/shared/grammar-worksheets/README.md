# Grammar worksheets for English and German

The [master prompt](MASTER-PROMPT.md) describes the three-page design extracted from the supplied images. The same renderer serves 144 German topics and 112 English topics, A1–C2. Each topic gets one focused decision across Learn, Practise and Assess. This is topic coverage, not a claim that a single worksheet exhausts every sub-skill within a broad topic.

`seeds-de.ts` and `seeds-en.ts` contain authored decisions, four controlled contexts, explicit transformations, contextual error distinctions and personal-production prompts. The German A1 seeds and original possessive set remain in the German content package. `seed-builder.ts` creates the common worksheet structure. Missing, duplicate or unknown catalog mappings fail the build.

`runtime.js`, `worksheets.css` and `ink.js` are shared sources. Run `bun run worksheets:build` in either app to copy the renderer, that language's content, and the Lucide icon exports into its public directory. The web production build runs this command automatically. Edit shared sources rather than generated public files.

Each typed answer and drawing is saved separately in the existing app origin's local storage, under a worksheet-specific key. Pen input uses Pointer Events, pressure, pointer capture, coalesced samples and a fixed drawing coordinate system. The writing pad also accepts a finger or mouse. Undo and a stroke eraser are available. Local storage errors are shown to the learner. There is no OCR, automatic grading, cross-device sync or mastery credit for worksheet entries.

The three print actions have different purposes:

- Blank handout: exactly three A4 learner pages, including writing lines and unmarked review boxes.
- Answer key: separate pages containing the answer, cause, cue, category and contrast.
- My answers: typed text and ink, with extra pages allowed to preserve longer writing.

Run `bun test shared/grammar-worksheets/content.test.ts` from the repository root. For browser checks, use a disposable local Chrome profile with debugging on port 9337, start the apps on their normal ports, and run `node shared/grammar-worksheets/verify-browser.mjs`. Set `WORKSHEET_LANGUAGE=en` for English; the default is German. The test checks interaction, typed/pen persistence, erasing and undo, responsive widths, and all topic layouts in both instruction modes. Its output belongs to `artifacts/grammar-worksheets` and contains synthetic learner data.

Physical Apple Pencil, Android stylus and Windows pen hardware need a separate device check. Browser Pointer Events tests demonstrate the software path, not a hardware certification or a learning-outcome result.

Grammar review references used for specific distinctions include [IDS on indirect speech](https://grammis.ids-mannheim.de/systematische-grammatik/643), [IDS on comparison clauses](https://grammis.ids-mannheim.de/systematische-grammatik/2117), [Cambridge on used to and be used to](https://dictionary.cambridge.org/grammar/british-grammar/word-choice-used-to-and-be-used-to), and [Cambridge on tag questions](https://dictionary.cambridge.org/grammar/british-grammar/question-tags). Examples in these worksheets are original. Grammatically possible alternatives that miss a specified meaning or register are labelled as target mismatches.
