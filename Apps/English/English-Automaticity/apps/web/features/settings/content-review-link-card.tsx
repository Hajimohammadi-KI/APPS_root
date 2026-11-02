import { ClipboardCheck } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

// Red so a reviewer finds it on a long settings page.
const RED = "#b91c1c";

/** The entry to the independent content review page (W33). */
export function ContentReviewLinkCard() {
	return (
		<Card data-content-review-link>
			<CardHeader>
				<CardTitle style={{ color: RED }}>
					<ClipboardCheck aria-hidden className="mr-2 inline size-5" />
					Independent content review (for reviewers)
				</CardTitle>
				<CardDescription>
					A language reviewer checks every unit and exercise and downloads a
					file for the app owner. Learners do not need this page.
				</CardDescription>
			</CardHeader>
			<CardContent className="settings-section">
				<a
					className="font-semibold underline"
					href="/learning-core/content-review.html"
					style={{ color: RED }}
				>
					Open the content review page
				</a>
			</CardContent>
		</Card>
	);
}
