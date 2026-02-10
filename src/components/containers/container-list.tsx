"use client";

import { useState, useMemo } from "react";
import { Search, LayoutGrid, List, Box, Plus } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ContainerCard, ContainerCardSkeleton } from "./container-card";
import type { ContainerInfo } from "@/types/docker";
import { toast } from "sonner";

type StatusFilter = "all" | "running" | "stopped";
type ViewMode = "grid" | "list";

interface ContainerListProps {
  containers: ContainerInfo[];
  loading: boolean;
  error: string | null;
  onAction: (id: string, action: "start" | "stop" | "restart" | "remove") => Promise<void>;
}

export function ContainerList({ containers, loading, error, onAction }: ContainerListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    containerId: string;
    containerName: string;
    action: "remove" | "stop";
  } | null>(null);

  const filtered = useMemo(() => {
    return containers.filter((c) => {
      const matchesSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.image.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "running" && c.status === "running") ||
        (statusFilter === "stopped" && c.status !== "running");

      return matchesSearch && matchesStatus;
    });
  }, [containers, search, statusFilter]);

  const counts = useMemo(() => {
    const running = containers.filter((c) => c.status === "running").length;
    return { total: containers.length, running, stopped: containers.length - running };
  }, [containers]);

  async function handleAction(
    id: string,
    action: "start" | "stop" | "restart" | "remove",
  ) {
    const container = containers.find((c) => c.id === id);
    const name = container?.name ?? id.slice(0, 12);

    // Confirm destructive actions
    if (action === "remove") {
      setConfirmDialog({ open: true, containerId: id, containerName: name, action: "remove" });
      return;
    }

    setActionLoading(id);
    try {
      await onAction(id, action);
      const labels: Record<string, string> = {
        start: "started",
        stop: "stopped",
        restart: "restarted",
      };
      toast.success(`Container "${name}" ${labels[action]}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${action}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleConfirmedAction() {
    if (!confirmDialog) return;
    const { containerId, containerName, action } = confirmDialog;
    setConfirmDialog(null);
    setActionLoading(containerId);
    try {
      await onAction(containerId, action);
      toast.success(`Container "${containerName}" removed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${action}`);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search containers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All ({counts.total})
              </SelectItem>
              <SelectItem value="running">
                Running ({counts.running})
              </SelectItem>
              <SelectItem value="stopped">
                Stopped ({counts.stopped})
              </SelectItem>
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex border border-border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
              : "space-y-3"
          }
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <ContainerCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-border rounded-lg">
          <Box className="h-10 w-10 text-muted-foreground/50 mb-3" />
          {containers.length === 0 ? (
            <>
              <p className="font-medium text-muted-foreground">No containers yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Create your first container to get started
              </p>
              <Button asChild>
                <Link href="/containers/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Container
                </Link>
              </Button>
            </>
          ) : (
            <>
              <p className="font-medium text-muted-foreground">No matches</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search or filter
              </p>
            </>
          )}
        </div>
      )}

      {/* Container list */}
      {!loading && filtered.length > 0 && (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
              : "space-y-3"
          }
        >
          {filtered.map((container) => (
            <ContainerCard
              key={container.id}
              container={container}
              onAction={handleAction}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}

      {/* Results count */}
      {!loading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Showing {filtered.length} of {containers.length} containers
        </p>
      )}

      {/* Confirm dialog */}
      <Dialog
        open={confirmDialog?.open ?? false}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog?.action === "remove" ? "Remove" : "Stop"} Container
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmDialog?.action}{" "}
              <span className="font-semibold text-foreground">
                {confirmDialog?.containerName}
              </span>
              ?
              {confirmDialog?.action === "remove" &&
                " This will stop and permanently delete the container."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmedAction}>
              {confirmDialog?.action === "remove" ? "Remove" : "Stop"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
