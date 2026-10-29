"use client";
import { discourseFeedback } from "@automaticity/learning-core/discourse";
import { useState } from "react";
import { compareSpeechTarget, describeAnswerEdits, phoneticPractice, type WaveformDescription, type RecognitionEvidence } from "@automaticity/learning-core/speech";
export function SpeechPracticePanel({ transcript, evidence, waveform, language, level, onSpeak }: { readonly transcript: string; readonly evidence: RecognitionEvidence | null; readonly waveform: WaveformDescription | null; readonly language: "en" | "de"; readonly level: string; readonly onSpeak: (text: string) => void }) {
 const [target, setTarget] = useState("");
 const en = language === "en";
 const comparison = target.trim() && transcript.trim() ? compareSpeechTarget(transcript, target) : null;
 const discourse = discourseFeedback(transcript, language, level);
 const contrasts = phoneticPractice(target || transcript, language);
 return <section className="record-card" aria-label={en ? "Read aloud practice" : "Laut lesen"}>
  <div className="record-main">
   <h3>{en ? "Read aloud practice" : "Laut lesen"}</h3>
   <p>{en ? "Recognition can miss sounds. Review the transcript; these comparisons do not score pronunciation." : "Die Erkennung kann Laute übersehen. Prüfe das Transkript; dieser Vergleich bewertet keine Aussprache."}</p>
   {evidence && <p role="status">{evidence.reliable ? (en ? "Recognition is consistent; listen again to check the sounds." : "Die Erkennung ist einheitlich; höre die Laute noch einmal an.") : (en ? "Recognition is uncertain. Check the alternatives before using text feedback." : "Die Erkennung ist unsicher. Prüfe Alternativen vor dem Textfeedback.")}</p>}
   {evidence && evidence.alternatives.some(a => a.length > 1) && <details><summary>{en ? "Recognition alternatives" : "Erkennungsalternativen"}</summary><ul>{evidence.alternatives.slice(0, 20).map((choices, i) => <li key={i}>{choices.map(c => c.transcript).join(" / ")}</li>)}</ul></details>}
   {waveform && <p>{en ? "Waveform description" : "Beschreibung der Wellenform"}: {waveform.durationSeconds.toFixed(1)} s; {en ? "active signal" : "aktives Signal"} {waveform.activeSeconds.toFixed(1)} s; {en ? "interior quiet intervals" : "innere ruhige Abschnitte"}: {waveform.quietIntervals}. {en ? "Background noise affects these measurements. No fluency score." : "Hintergrundgeräusche beeinflussen diese Messwerte. Keine Flüssigkeitsnote."}</p>}
   {transcript.trim() && <p>{discourse.description}</p>}
   {discourse.advanced && <p>{en ? "Connectors / cautious stance cues" : "Konnektoren / vorsichtige Haltung"}: {discourse.advanced.connectors.length} / {discourse.advanced.hedges.length}. {discourse.advanced.suggestion}</p>}
   <label>{en ? "Target sentence (optional)" : "Zielsatz (optional)"}<input value={target} maxLength={500} onChange={e => setTarget(e.target.value)} /></label>
   <button type="button" disabled={!target.trim()} onClick={() => onSpeak(target)}>{en ? "Hear target" : "Zielsatz hören"}</button>
   {comparison && <p>{comparison.edits.length ? describeAnswerEdits(comparison.edits, language) : (en ? "The recognized words match the target. Pronunciation still needs listening." : "Die erkannten Wörter entsprechen dem Ziel. Die Aussprache muss weiter angehört werden.")}</p>}
   {contrasts.length > 0 && <div><p>{en ? "Optional sound contrasts — no pronunciation error has been diagnosed." : "Freiwillige Lautkontraste — es wurde kein Aussprachefehler festgestellt."}</p><ul>{contrasts.map(pair => <li key={pair.words[0]}>{pair.words.join(" / ")} ({pair.phonemes.join(" / ")}) <button type="button" onClick={() => onSpeak(pair.words.join(", "))}>{en ? "Listen" : "Anhören"}</button></li>)}</ul></div>}
  </div>
 </section>;
}
