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
        <CardTitle className="flex items-center gap-2" style={{ color: RED }}>
          <ClipboardCheck aria-hidden className="size-5" />
          Unabhängige Inhaltsprüfung (für Prüfende)
        </CardTitle>
        <CardDescription>
          Eine Person mit Sprachexpertise prüft jede Einheit und jede Übung und
          lädt eine Datei für die Betreuung der App herunter. Zum Lernen wird
          diese Seite nicht gebraucht.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <a
          className="font-semibold underline"
          href="/learning-core/content-review.html"
          style={{ color: RED }}
        >
          Seite zur Inhaltsprüfung öffnen
        </a>
      </CardContent>
    </Card>
  );
}
