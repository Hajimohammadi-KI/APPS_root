"use client";

import * as React from "react";
import { Brain, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
	analyzeLanguageSample,
	buildLanguageAnalysisLlmRequest,
	type HybridAnalysisSkill,
	type HybridLanguageAnalysis,
} from "@/lib/hybrid-language-analysis";
import {
	readAIProviderStatus,
	requestAIExplanation,
	type AIExplanationResponse,
	type AIProviderStatus,
} from "@/lib/desktop-ai";

const skillLabels: Readonly<Record<HybridAnalysisSkill, string>> = {
	listening: "Listening",
	speaking: "Speaking",
	reading: "Reading",
	writing: "Writing",
};

const signalTone = {
	observation: "border-emerald-200 bg-emerald-50 text-emerald-950",
	attention: "border-amber-200 bg-amber-50 text-amber-950",
	"not-available": "border-slate-200 bg-slate-50 text-slate-700",
} as const;

export function HybridLanguageCoach({
	initialSkill,
	initialResponseText = "",
	initialSourceText = "",
}: {
	initialSkill: HybridAnalysisSkill;
	initialResponseText?: string;
	initialSourceText?: string;
}) {
	const [skill, setSkill] = React.useState(initialSkill);
	const [responseText, setResponseText] = React.useState(initialResponseText);
	const [sourceText, setSourceText] = React.useState(initialSourceText);
	const [durationSeconds, setDurationSeconds] = React.useState("");
	const [analysis, setAnalysis] = React.useState<HybridLanguageAnalysis | null>(
		null,
	);
	const [provider, setProvider] = React.useState<AIProviderStatus | null>(null);
	const [llmResult, setLlmResult] =
		React.useState<AIExplanationResponse | null>(null);
	const [message, setMessage] = React.useState("");
	const [askingLlm, setAskingLlm] = React.useState(false);

	React.useEffect(() => {
		setSkill(initialSkill);
		setResponseText(initialResponseText);
		setSourceText(initialSourceText);
		setAnalysis(null);
		setLlmResult(null);
		setMessage("");
	}, [initialResponseText, initialSkill, initialSourceText]);

	React.useEffect(() => {
		let active = true;
		readAIProviderStatus()
			.then((status) => {
				if (active) setProvider(status);
			})
			.catch(() => {
				if (active) setProvider(null);
			});
		return () => {
			active = false;
		};
	}, []);

	function invalidateResult() {
		setAnalysis(null);
		setLlmResult(null);
		setMessage("");
	}

	function currentInput() {
		const duration = durationSeconds ? Number(durationSeconds) : undefined;
		return {
			skill,
			language: "en" as const,
			responseText,
			sourceText,
			...(duration === undefined ? {} : { durationSeconds: duration }),
		};
	}

	function runLocalAnalysis() {
		try {
			const next = analyzeLanguageSample(currentInput());
			setAnalysis(next);
			setLlmResult(null);
			setMessage(
				"Local rules finished. These are diagnostic observations, not a grade.",
			);
		} catch (error) {
			setAnalysis(null);
			setLlmResult(null);
			setMessage(error instanceof Error ? error.message : "Analysis failed.");
		}
	}

	async function askConnectedLlm() {
		if (!analysis || !provider?.connected) return;
		setAskingLlm(true);
		setLlmResult(null);
		setMessage("Waiting for the connected provider…");
		try {
			const response = await requestAIExplanation(
				buildLanguageAnalysisLlmRequest(currentInput(), analysis),
			);
			setLlmResult(response);
			setMessage(
				"Provider feedback received. Review it before applying any suggestion.",
			);
		} catch (error) {
			setMessage(
				error instanceof Error
					? error.message
					: "The connected AI provider did not return feedback.",
			);
		} finally {
			setAskingLlm(false);
		}
	}

	return (
		<section className="rounded-3xl border border-indigo-200 bg-indigo-50/60 p-4 shadow-sm sm:p-5">
			<details className="group overflow-hidden rounded-2xl border border-indigo-200 bg-white">
				<summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 sm:px-5">
					<span className="flex items-center gap-3">
						<span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-800">
							<Brain aria-hidden className="size-5" />
						</span>
						<span>
							<strong className="block text-base text-indigo-950">
								Hybrid NLP + LLM coach
							</strong>
							<span className="mt-0.5 block text-sm font-medium text-slate-600">
								Local observations first; connected AI feedback only on request
							</span>
						</span>
					</span>
					<span className="text-sm font-bold text-indigo-800 group-open:hidden">
						Open
					</span>
					<span className="hidden text-sm font-bold text-indigo-800 group-open:inline">
						Close
					</span>
				</summary>

				<div className="space-y-5 border-t border-indigo-200 p-4 sm:p-5">
					<div className="grid gap-4 lg:grid-cols-2">
						<label className="grid gap-2 text-sm font-bold text-slate-800">
							Skill
							<select
								className="h-11 rounded-xl border border-slate-300 bg-white px-3 font-medium outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
								onChange={(event) => {
									setSkill(event.target.value as HybridAnalysisSkill);
									invalidateResult();
								}}
								value={skill}
							>
								{Object.entries(skillLabels).map(([value, label]) => (
									<option key={value} value={value}>
										{label}
									</option>
								))}
							</select>
						</label>
						{skill === "speaking" ? (
							<label className="grid gap-2 text-sm font-bold text-slate-800">
								Real recording duration in seconds
								<input
									className="h-11 rounded-xl border border-slate-300 bg-white px-3 font-medium outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
									inputMode="numeric"
									min="10"
									onChange={(event) => {
										setDurationSeconds(event.target.value);
										invalidateResult();
									}}
									placeholder="For example: 45"
									type="number"
									value={durationSeconds}
								/>
							</label>
						) : null}
					</div>

					{skill === "listening" || skill === "reading" ? (
						<label className="grid gap-2 text-sm font-bold text-slate-800">
							Source text (optional, needed for transparent overlap)
							<Textarea
								maxLength={8_000}
								onChange={(event) => {
									setSourceText(event.target.value);
									invalidateResult();
								}}
								placeholder="Paste the text that was read or heard."
								value={sourceText}
							/>
						</label>
					) : null}

					<label className="grid gap-2 text-sm font-bold text-slate-800">
						Learner response or transcript
						<Textarea
							maxLength={8_000}
							onChange={(event) => {
								setResponseText(event.target.value);
								invalidateResult();
							}}
							placeholder="Write the response or paste a real transcript."
							value={responseText}
						/>
					</label>

					<div className="flex flex-wrap items-center gap-3">
						<Button disabled={!responseText.trim()} onClick={runLocalAnalysis}>
							<CheckCircle2 aria-hidden /> Run local NLP rules
						</Button>
						<Button
							disabled={!analysis || !provider?.connected || askingLlm}
							onClick={askConnectedLlm}
							variant="outline"
						>
							<Sparkles aria-hidden />
							{askingLlm ? "Waiting…" : "Ask connected LLM"}
						</Button>
						<span className="text-sm font-semibold text-slate-600">
							{provider === null
								? "Checking AI connection…"
								: provider.connected
									? `${provider.providerLabel ?? "AI"}${provider.model ? ` · ${provider.model}` : ""}`
									: "LLM unavailable · connect a provider in Settings"}
						</span>
					</div>

					{analysis ? (
						<div className="space-y-4">
							<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
								{analysis.signals.map((signal) => (
									<article
										className={`rounded-2xl border p-4 ${signalTone[signal.status]}`}
										key={signal.id}
									>
										<p className="text-xs font-black uppercase tracking-wide">
											{signal.status === "not-available"
												? "N/A"
												: signal.status}
										</p>
										<p className="mt-1 text-lg font-black">
											{signal.label}: {signal.value}
										</p>
										<p className="mt-2 text-sm leading-6 opacity-80">
											{signal.detail}
										</p>
									</article>
								))}
							</div>
							<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
								<p className="flex items-center gap-2 font-black">
									<ShieldAlert aria-hidden className="size-4" /> Evidence limits
								</p>
								<ul className="mt-2 list-disc space-y-1 pl-5">
									{analysis.limitations.map((limitation) => (
										<li key={limitation}>{limitation}</li>
									))}
								</ul>
							</div>
						</div>
					) : null}

					{llmResult ? (
						<article className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
							<p className="text-sm font-black text-violet-950">
								Provider feedback · {llmResult.providerLabel} ·{" "}
								{llmResult.model}
							</p>
							<p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-violet-950">
								{llmResult.text}
							</p>
							<p className="mt-3 text-xs font-bold text-violet-800">
								Unverified diagnostic feedback — never a mastery or CEFR result.
							</p>
						</article>
					) : null}

					{message ? (
						<p aria-live="polite" className="text-sm font-bold text-slate-700">
							{message}
						</p>
					) : null}
				</div>
			</details>
		</section>
	);
}
