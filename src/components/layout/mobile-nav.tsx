"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Box,
  HardDrive,
  Network,
  Database,
  Plus,
  Container,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Containers", href: "/containers", icon: Box },
  { name: "Images", href: "/images", icon: Container },
  { name: "Volumes", href: "/volumes", icon: Database },
  { name: "Networks", href: "/networks", icon: Network },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 h-16 border-b border-border">
        <HardDrive className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">OneClick Docker</span>
      </div>

      {/* Create Button */}
      <div className="px-4 pt-4">
        <Button asChild className="w-full">
          <Link href="/containers/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Container
          </Link>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-4 space-y-1">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
