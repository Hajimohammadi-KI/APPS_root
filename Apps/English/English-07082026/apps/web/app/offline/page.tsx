import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OfflinePage() {
  return (
    <main className="mx-auto grid min-h-screen max-w-2xl place-items-center p-6">
      <Card>
        <CardHeader>
          <CardTitle>You are offline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Installed lessons and saved progress remain available. Reopen the
            app to continue.
          </p>
          <Button asChild>
            <Link href="/">Open app</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
