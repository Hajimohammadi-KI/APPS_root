"use client";

import Image from "next/image";
import {
	ArrowRight,
	BookOpen,
	CheckCircle2,
	Clock3,
	Mic2,
	PenLine,
	ShieldCheck,
	Target,
	TriangleAlert,
} from "lucide-react";
import { grammarUnits } from "@grammar/content";
import {
	currentDailyPlan,
	dailyPlanCompletionPercent,
	lessonKey,
	useAppStore,
} from "@/features/store/app-store";
import type { ScreenId } from "@/lib/app-navigate";

export function MissionHomeScreen({
	navigate,
}: {
	navigate: (screen: ScreenId) => void;
}) {
	const { state } = useAppStore();
	const plan = currentDailyPlan(state);
	const name = state.learner.displayName.trim() || "Learner";
	const level = state.learner.selfDeclaredLevel ?? "A1";
	const selectedUnit = state.todayGrammar
		? grammarUnits.find((unit) => unit.title === state.todayGrammar?.title)
		: grammarUnits.find((unit) => unit.level === level);
	const targetTitle = selectedUnit?.title ?? "Verb be: am/is/are";
	const targetLevel = selectedUnit?.level ?? level;
	const progress = selectedUnit
		? dailyPlanCompletionPercent(plan, lessonKey(selectedUnit.title))
		: 0;
	const dueReviews = state.reviews.filter(
		(review) => review.status === "pending" && review.dueAt <= Date.now(),
	).length;
	const repairItems = state.errors
		.filter((item) => item.repairStatus !== "fixed")
		.sort((left, right) => right.occurrenceCount - left.occurrenceCount)
		.slice(0, 3);
	const verifiedSpeaking = state.attempts.filter(
		(attempt) => attempt.mode === "speaking" && attempt.verified,
	).length;
	const verifiedWriting = state.attempts.filter(
		(attempt) => attempt.mode === "writing" && attempt.verified,
	).length;
	const verifiedTransfer = state.attempts.filter(
		(attempt) => attempt.mode === "transfer" && attempt.verified,
	).length;

	return (
		<div className="mission-home">
			<header className="mission-home__greeting">
				<div>
					<p className="mission-home__eyebrow">Your automaticity workspace</p>
					<h1>Good morning, {name}</h1>
					<p>Build accurate, confident English through one focused path.</p>
				</div>
				<button
					className="mission-home__focus-button"
					onClick={() => navigate("grammar")}
					type="button"
				>
					<Target aria-hidden /> Change focus
				</button>
			</header>

			<section className="mission-home__hero" aria-labelledby="mission-title">
				<Image
					alt="Learner studying English with a laptop and notebook"
					className="mission-home__hero-image"
					height={1024}
					priority
					sizes="(max-width: 760px) 100vw, 72vw"
					src="/learning-hero.png"
					width={1536}
				/>
				<div className="mission-home__hero-copy">
					<span className="mission-home__target-label">
						<Target aria-hidden /> Today&apos;s adaptive mission
					</span>
					<h2 id="mission-title">{targetTitle} · {targetLevel}</h2>
					<p>Recall it accurately, automate it aloud, then use it in a new context.</p>
					<div className="mission-home__meta">
						<span><Clock3 aria-hidden /> ~{state.settings.dailyStudyMinutes} minutes</span>
						<span><Mic2 aria-hidden /> Speaking &amp; writing</span>
					</div>
					<button
						className="mission-home__primary"
						onClick={() => navigate("daily")}
						type="button"
					>
						Start today&apos;s mission <ArrowRight aria-hidden />
					</button>
				</div>
				<div className="mission-home__progress" aria-label={`${progress}% complete`}>
					<strong>{progress}%</strong>
					<span>today&apos;s progress</span>
				</div>
			</section>

			<section className="mission-home__path" aria-label="Three-step learning path">
				<LearningStep icon={BookOpen} number="1" title="Recall" text="Activate and use the target accurately." />
				<LearningStep icon={Mic2} number="2" title="Automate aloud" text="Speak the target naturally and confidently." />
				<LearningStep icon={PenLine} number="3" title="Transfer" text="Use it independently in a new context." />
			</section>

			<div className="mission-home__lower-grid">
				<section className="mission-home__panel" aria-labelledby="repairs-title">
					<div className="mission-home__panel-heading">
						<span className="mission-home__panel-icon mission-home__panel-icon--repair"><TriangleAlert aria-hidden /></span>
						<div><h2 id="repairs-title">Repair items</h2><p>Keep recurring patterns on your radar.</p></div>
					</div>
					<div className="mission-home__list">
						{repairItems.length ? repairItems.map((item) => (
							<button key={item.id} onClick={() => navigate("errors")} type="button">
								<span><strong>{item.topic || item.grammarTitle}</strong><small>{item.errorClass.replaceAll("_", " ")}</small></span>
								<b>{item.occurrenceCount}×</b><ArrowRight aria-hidden />
							</button>
						)) : (
							<div className="mission-home__empty"><CheckCircle2 aria-hidden /><span><strong>No repair is waiting</strong><small>Your saved corrections are clear.</small></span></div>
						)}
					</div>
					<button className="mission-home__text-link" onClick={() => navigate("errors")} type="button">
						Open repair list <ArrowRight aria-hidden />
					</button>
				</section>

				<section className="mission-home__panel" aria-labelledby="evidence-title">
					<div className="mission-home__panel-heading">
						<span className="mission-home__panel-icon mission-home__panel-icon--evidence"><ShieldCheck aria-hidden /></span>
						<div><h2 id="evidence-title">Verified-evidence summary</h2><p>Only independently checked practice is shown.</p></div>
					</div>
					<div className="mission-home__evidence-list">
						<EvidenceRow icon={Mic2} label="Speaking" value={verifiedSpeaking} />
						<EvidenceRow icon={PenLine} label="Writing" value={verifiedWriting} />
						<EvidenceRow icon={Target} label="Transfer" value={verifiedTransfer} />
					</div>
					<button className="mission-home__text-link" onClick={() => navigate("progress")} type="button">
						View learning evidence <ArrowRight aria-hidden />
					</button>
				</section>
			</div>

			{dueReviews > 0 ? (
				<button className="mission-home__review-strip" onClick={() => navigate("daily")} type="button">
					<span><Clock3 aria-hidden /><strong>{dueReviews} review{dueReviews === 1 ? "" : "s"} due</strong></span>
					<span>Review before starting something new <ArrowRight aria-hidden /></span>
				</button>
			) : null}
		</div>
	);
}

function LearningStep({ icon: Icon, number, title, text }: { icon: typeof BookOpen; number: string; title: string; text: string }) {
	return <article className="mission-home__step"><span className="mission-home__step-number">{number}</span><span className="mission-home__step-icon"><Icon aria-hidden /></span><div><h3>{title}</h3><p>{text}</p></div></article>;
}

function EvidenceRow({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: number }) {
	return <div className="mission-home__evidence-row"><span><Icon aria-hidden /></span><div><strong>{label}</strong><small>Verified attempts</small></div><b>{value}</b></div>;
}
