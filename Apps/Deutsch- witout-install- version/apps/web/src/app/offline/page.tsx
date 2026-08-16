import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="mx-auto grid min-h-screen max-w-2xl place-items-center p-6">
      <Card>
        <CardHeader>
          <CardTitle>Du bist offline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Installierte Lektionen und gespeicherter Fortschritt bleiben
            verfügbar. Öffne die App erneut, um weiterzulernen.
          </p>
          <Link
            href="/"
            className={buttonVariants({ variant: "default", size: "default" })}
          >
            App öffnen
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
