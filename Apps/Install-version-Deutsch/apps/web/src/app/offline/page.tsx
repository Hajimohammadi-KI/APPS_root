import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <section
      aria-labelledby="offline-title"
      className="mx-auto grid min-h-[calc(100dvh-8rem)] max-w-2xl place-items-center p-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 id="offline-title">Du bist offline</h1>
          </CardTitle>
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
    </section>
  );
}
