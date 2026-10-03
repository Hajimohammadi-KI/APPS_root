# R36 real-data assessment diagnostics

This directory contains source receipts, frozen datasets and actual predictions, not curriculum approval. Raw licensed datasets, model files, API-key files and the Python environment stay outside app/public and deployment staging. Both public apps receive only aggregate reports and links.

## Results on 2026-10-03

- Writing, Qwen3-4B Q4_K_M: 512 sentences, 128 reference-edited and 128 reference-unchanged per language. English false acceptance 22/128, reference-clean acceptance 89/128. German 19/128 and 87/128. Both fail the preregistered diagnostic screen.
- Code review found 24 contradictory `correct` verdicts with changed corrections and 12 `incorrect` verdicts with unchanged corrections. The original run is preserved. `writing-qwen3-4b-v1/sensitivity.json` is explicitly post-hoc, not a new qualification run.
- Audio, published HuBERT APA checkpoint: all 2,500 official test recordings / 125 speakers processed from waveform only. Pronunciation MAE 0.830, Pearson 0.670; fluency MAE 0.687, Pearson 0.751. Neither meets the correlation threshold 0.8. These are not accuracy percentages.
- SpeechOcean corpus integrity: 5,000 PCM16 mono/16kHz files, 5.567 hours, five source expert ratings each; 125 train and 125 test speakers, no speaker or audio-byte overlap.
- Published audio model development inspected the official test set each epoch. This is an individual-recording diagnostic using published weights, not independent model qualification or exact reproduction of padded-batch inference. Weight redistribution licence remains unconfirmed; weights are not deployed.
- No German or Persian-L1 pronunciation qualification, no spontaneous-speech qualification, no app-task meaning/target qualification and no >=90% learning-outcome claim.

## Sources and terms

1. W&I+LOCNESS v2.1: <https://www.cl.cam.ac.uk/research/nl/bea2019st/>. Local noncommercial research/educational diagnostics only; retain `licence.wi.txt` and `license.locness.txt`.
2. Falko–MERLIN: <https://github.com/adrianeboyd/boyd-wnut2018>. Falko CC BY 3.0, MERLIN CC BY-SA 4.0; attribution and bundled licence retained. The downloaded release also contains Wikipedia pairs; those are not used in this diagnostic.
3. SpeechOcean762: <https://openslr.org/101/> and <https://github.com/jimbozhang/speechocean762>. CC BY 4.0; Zhang et al., Interspeech 2021. Original OpenSLR release used, not an unversioned third-party copy. Updated annotations would require a new run version.
4. HuBERT APA: <https://github.com/hy310/ssl_finetuning>, Lee, Kim and Chung, APSIPA ASC 2024; code MIT. Published weights <https://huggingface.co/haeylee/ssl_ft_pron>, revision in `data/audio-model/receipt.json`.
5. Qwen official GGUF <https://huggingface.co/Qwen/Qwen3-4B-GGUF>, Apache 2.0, and llama.cpp b11146 <https://github.com/ggml-org/llama.cpp/releases/tag/b11146>, MIT. Publisher hashes verified before use.

German candidates documented for follow-up: [IFCASL](https://ifcasl.org/corpus.html) supplies illustrative phonetic samples; full reuse terms/access need clarification. [HAMATAC](https://www.fdr.uni-hamburg.de/record/1480) is restricted access. Ordinary ASR corpora and text CEFR corpora do not substitute for human pronunciation/fluency ratings. No access restrictions were bypassed and no permission emails were sent.

W&I citation: Helen Yannakoudakis, Øistein E. Andersen, Ardeshir Geranpayeh, Ted Briscoe and Diane Nicholls (2018), *Developing an automated writing placement system for ESL learners*, Applied Measurement in Education 31(3), 251–267. LOCNESS credit: Centre for English Corpus Linguistics (CECL), Université catholique de Louvain, Belgium. Because LOCNESS requests sending an offprint for research publication and no correspondence is authorized, its results remain local. `public-report.json` includes only 453 W&I / Falko–MERLIN sentences (197 English, 256 German); it openly records that the English no-edit subset has only 96 cases and cannot meet the 100-per-class screen. No source was excluded to improve model scores.

## Re-running

Use Bun for orchestration. Python is isolated in `.venv` for the audio model only; `requirements.lock.txt` records installed versions. Torch 2.8.0+cu128 came from the official PyTorch wheel index. Safetensors load with strict state-dict matching; downloaded Python and pickle files are not executed.

1. `bun research/assessment-benchmark/download-sources.ts`
2. `bun research/assessment-benchmark/extract-sources.ts`
3. `bun research/assessment-benchmark/download-audio-model.ts`
4. Dataset preparation scripts create immutable `runs/*/cases.jsonl` and manifests. Existing versions refuse overwrites; choose a new versioned output path before regenerating.
5. `run-writing.ts` expects the pinned llama server on 127.0.0.1:8769, four slots, thinking disabled, GPU layers 99, context 16384, no agent tools/UI, restrictive CORS, and an API key in `data/llama-api-key.local`. Never expose this service publicly. The task's server was stopped after inference.
6. `run-audio.py` loads local weights/config/processor, hashes recordings and predicts one recording at a time. The original v1 uses float32 on RTX 5060 Ti, no transcript input. Existing prediction files refuse overwrite.
7. `summarize-audio.ts` verifies all expected IDs/speakers before producing metrics. `writing-sensitivity.ts` preserves raw v1 metrics and reports stricter consistency handling separately.
8. `bun scripts/prepare-assessment-benchmarks.ts` publishes only aggregates to both app public directories. `bun scripts/build-automaticity-assets.ts` synchronizes the actual practice changes.

The original v1 writing identity was verified after the run and is explicitly labelled `identity-post-run.json`; future runs attest identity before inference. Audio post-run hashes and dependency lock are supplemental provenance, not a claim that those checks were logged earlier.

## App changes

- `/assessment-benchmarks.html` and `.json`: actual aggregate outcomes, dataset sources and open R36 scopes.
- `/microphone-check.html`: six-second recording, automatic stop, local signal diagnostics, playback and explicit learner confirmation; no upload, no persistent recording and no mastery event.
- Transformer repair validation rejects unchanged corrections, including whitespace/Unicode-only differences. Prompt version and configuration binding were advanced so old approvals cannot silently authorize the changed contract.

Physical Windows capture was tested on 2026-10-03: default input for five seconds, default-output driver playback, one-second input reopening, and separate three-second captures from UGREEN and EPOS. Every buffer completed and all cleanup calls succeeded. UGREEN was low-level (−51.53 dBFS); EPOS was near silence (−96.19 dBFS). Speech clarity, acoustic output audibility, browser/app operation and phone/tablet operation remain unverified. The explicit device tests were capture-only. No raw audio was stored or uploaded. See `../../artifacts/physical-microphone-20261003/README.md` and `../../docs/physical-microphone-check.json`.

## R55 follow-up

See `../../docs/LANGUAGE-TEXT-ASSESSMENT-R55.md` for both failed experiments and the exact tradeoff. The final staged diagnostic reduces false accepts to 14/101 English and 17/128 German, with correct acceptance only 55/96 and 70/128 and no valid error corrections. Neither candidate is approved. `run-writing-pass-review.ts` runs the task-review pair; `run-writing-text-check.ts` adds a text-only veto to frozen intermediate outcomes. Existing runs refuse overwrite. Changes to the candidate require a new frozen version and qualification; these commands do not activate production models.
