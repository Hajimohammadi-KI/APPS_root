import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function OfflinePage() {
  return (
    <section
      aria-labelledby="offline-title"
      className="mx-auto grid min-h-[calc(100dvh-8rem)] max-w-2xl place-items-center p-6"
    >
      <Card>
        <CardHeader>
          <h1
            className="text-xl font-extrabold tracking-tight"
            id="offline-title"
          >
            You are offline
          </h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Installed lessons and saved progress remain available. Reopen the
            app to continue.
          </p>
          <Button render={<Link href="/" />}>
            Open app
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
