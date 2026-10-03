"""Local reproduction of the published HuBERT APA head, never a release approval.

Architecture follows hy310/ssl_finetuning train/baseline.py (MIT), pinned in
artifacts/r36-datasets-20261003/audio-code-metadata.json. We load safetensors,
not pickle or remote Python. One recording per forward pass avoids scores that
depend on another recording's padding. No transcript or reference score is input.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import time
import wave

os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"
import numpy as np
import torch
from safetensors.torch import load_file
from transformers import HubertConfig, HubertModel, Wav2Vec2FeatureExtractor

ROOT = Path(__file__).resolve().parent
RUN = ROOT / "runs/audio-hubert-v1"
MODEL = ROOT / "data/audio-model"


class PronunciationScorer(torch.nn.Module):
    def __init__(self, config: HubertConfig) -> None:
        super().__init__()
        self.model = HubertModel(config)
        self.score_predictor = torch.nn.Linear(config.hidden_size, 4)

    def forward(self, samples: torch.Tensor) -> torch.Tensor:
        hidden = self.model(input_values=samples).last_hidden_state
        return self.score_predictor(hidden.mean(dim=1))


def read_pcm(path: Path) -> np.ndarray:
    with wave.open(str(path), "rb") as source:
        if (source.getnchannels(), source.getsampwidth(), source.getframerate(), source.getcomptype()) != (1, 2, 16000, "NONE"):
            raise ValueError("Unsupported waveform")
        samples = np.frombuffer(source.readframes(source.getnframes()), dtype="<i2").astype(np.float32) / 32768.0
    if samples.size < 1600 or samples.size > 16000 * 60 or not np.isfinite(samples).all():
        raise ValueError("Invalid recording length/samples")
    return samples


def main() -> None:
    torch.manual_seed(36)
    torch.set_num_threads(4)
    torch.backends.cudnn.benchmark = False
    torch.backends.cuda.matmul.allow_tf32 = False
    manifest = json.loads((RUN / "manifest.json").read_text(encoding="utf-8"))
    source = (RUN / "cases.jsonl").read_bytes()
    if hashlib.sha256(source).hexdigest() != manifest["casesSha256"]:
        raise ValueError("Frozen corpus manifest changed")
    if hashlib.sha256((MODEL / "model.safetensors").read_bytes()).hexdigest() != "60fc821bad4f91028d66f71d1e7b7c45965f6c7770fdec90c013b70e50da077c":
        raise ValueError("Model hash mismatch")
    rows = [json.loads(line) for line in source.splitlines()]
    test = [row for row in rows if row["split"] == "test"]
    config = HubertConfig.from_json_file(str(MODEL / "config.json"))
    model = PronunciationScorer(config)
    model.load_state_dict(load_file(str(MODEL / "model.safetensors")), strict=True)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model.to(device).eval()
    processor = Wav2Vec2FeatureExtractor.from_pretrained(str(MODEL), local_files_only=True)
    artifact_hashes = {name: hashlib.sha256((MODEL / name).read_bytes()).hexdigest()
                       for name in ("model.safetensors", "config.json", "preprocessor_config.json")}
    run_config = {"model": "haeylee/ssl_ft_pron/hubert/general/07_hubert-base-ls960", "device": device,
                  "artifactHashes": artifact_hashes,
                  "torch": torch.__version__, "batchSize": 1, "dtype": "float32", "seed": 36,
                  "casesSha256": manifest["casesSha256"], "codeSha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                  "padding": "none, individual recording", "referenceTextInput": False,
                  "scoreOrder": ["accuracy", "fluency", "prosodic", "total"], "releaseEligible": False}
    # Exclusive create: a second execution must use a fresh versioned run.
    with (RUN / "predictions.jsonl").open("x", encoding="utf-8") as output:
        (RUN / "config.json").write_text(json.dumps(run_config, indent=2), encoding="utf-8")
        with torch.inference_mode():
            for index, row in enumerate(test):
                started = time.perf_counter()
                prediction = {"id": row["id"], "speaker": row["speaker"]}
                try:
                    path = (ROOT / row["path"]).resolve()
                    if not path.is_relative_to(ROOT / "data/speech"):
                        raise ValueError("Recording outside dataset root")
                    if hashlib.sha256(path.read_bytes()).hexdigest() != row["audioSha256"]:
                        raise ValueError("Audio hash changed")
                    samples = read_pcm(path)
                    tensor = processor(samples, sampling_rate=16000, return_tensors="pt").input_values.to(device)
                    scores = model(tensor)[0].cpu().tolist()
                    if len(scores) != 4 or not all(np.isfinite(scores)):
                        raise ValueError("Nonfinite assessment")
                    prediction["scores"] = dict(zip(run_config["scoreOrder"], scores))
                except (ValueError, RuntimeError, OSError) as error:
                    prediction["failure"] = f"{type(error).__name__}: {error}"
                prediction["elapsedMs"] = round((time.perf_counter() - started) * 1000)
                output.write(json.dumps(prediction) + "\n")
                if (index + 1) % 100 == 0:
                    output.flush()
                    print(json.dumps({"completed": index + 1, "total": len(test)}), flush=True)
    print(json.dumps({"completed": len(test), "device": device}), flush=True)


if __name__ == "__main__":
    main()
