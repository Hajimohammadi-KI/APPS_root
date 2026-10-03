"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Brand } from "@/components/brand";
import { LearningNavigation } from "@/components/learning-navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Navigation öffnen" />
        }
      >
        <Menu />
      </SheetTrigger>
      <SheetContent side="left" className="w-[19rem] max-w-[85vw]">
        <SheetHeader className="border-b">
          <Brand />
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Bereiche der Lernanwendung
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <LearningNavigation
            language="de"
            current={pathname}
            onNavigate={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
