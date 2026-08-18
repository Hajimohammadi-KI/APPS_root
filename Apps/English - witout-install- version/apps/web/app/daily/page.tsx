import { AutomaticityScreen } from "@/features/screens/automaticity-screen";

// "Today's Practice" used to be rewritten (next.config.ts) straight to a
// static HTML mockup with a fixed 7-item list, fabricated "0 of 7
// activities"/"0% verified mastery" stats that no script ever updated, and
// its own separate localStorage key that could never agree with Home's
// real progress. This route now renders the same real, mastery-safe
// Mission component /progress already uses -- one evidence store, real
// numbers.
export default function DailyPracticePage() {
	return <AutomaticityScreen />;
}
