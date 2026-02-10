"use client";

import { HardDrive, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { MobileNav } from "./mobile-nav";

export function Header() {
  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:pl-64">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <MobileNav />
          </SheetContent>
        </Sheet>

        {/* Mobile logo */}
        <div className="flex items-center gap-2 md:hidden">
          <HardDrive className="h-5 w-5 text-primary" />
          <span className="font-semibold">OneClick Docker</span>
        </div>

        {/* Spacer for desktop */}
        <div className="hidden md:block" />

        {/* Right side - placeholder for future features like theme toggle */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm text-muted-foreground hidden sm:inline">Docker Connected</span>
        </div>
      </div>
    </header>
  );
}
