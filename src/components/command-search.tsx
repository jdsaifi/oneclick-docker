"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Database,
  Network,
  Plus,
  LayoutDashboard,
  Search,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

interface ContainerResult {
  id: string;
  name: string;
  image: string;
  status: string;
}

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [containers, setContainers] = useState<ContainerResult[]>([]);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const fetchContainers = useCallback(async () => {
    try {
      const res = await fetch("/api/containers");
      if (res.ok) {
        const data = await res.json();
        setContainers(
          data.map((c: { id: string; name: string; image: string; state: string }) => ({
            id: c.id,
            name: c.name,
            image: c.image,
            status: c.state,
          })),
        );
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    if (open) fetchContainers();
  }, [open, fetchContainers]);

  function navigate(path: string) {
    setOpen(false);
    router.push(path);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search containers, navigate..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => navigate("/")}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => navigate("/containers")}>
            <Box className="mr-2 h-4 w-4" />
            Containers
          </CommandItem>
          <CommandItem onSelect={() => navigate("/containers/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Container
          </CommandItem>
          <CommandItem onSelect={() => navigate("/images")}>
            <Container className="mr-2 h-4 w-4" />
            Images
          </CommandItem>
          <CommandItem onSelect={() => navigate("/volumes")}>
            <Database className="mr-2 h-4 w-4" />
            Volumes
          </CommandItem>
          <CommandItem onSelect={() => navigate("/networks")}>
            <Network className="mr-2 h-4 w-4" />
            Networks
          </CommandItem>
        </CommandGroup>

        {containers.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Containers">
              {containers.map((c) => (
                <CommandItem
                  key={c.id}
                  onSelect={() => navigate(`/containers/${c.id}`)}
                >
                  <Box className="mr-2 h-4 w-4" />
                  <span className="flex-1">{c.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{c.image}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
