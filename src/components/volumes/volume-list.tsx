"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Trash2,
  Plus,
  Loader2,
  Database,
  MoreVertical,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Volume {
  name: string;
  driver: string;
  mountpoint: string;
  createdAt: string;
  labels: Record<string, string>;
  scope: string;
  inUse: boolean;
}

export function VolumeList() {
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<Volume | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchVolumes = useCallback(async () => {
    try {
      const res = await fetch("/api/volumes");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setVolumes(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVolumes();
  }, [fetchVolumes]);

  const filtered = volumes.filter(
    (v) => !search || v.name.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/volumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.details || body.error);
      }
      toast.success(`Volume "${newName.trim()}" created`);
      setNewName("");
      setShowCreate(false);
      fetchVolumes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!deleteDialog) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/volumes/${encodeURIComponent(deleteDialog.name)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.details || body.error);
      }
      toast.success(`Volume "${deleteDialog.name}" removed`);
      setDeleteDialog(null);
      fetchVolumes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search volumes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Create Volume
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4 pb-4">
                <div className="h-5 w-48 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 border border-dashed border-border rounded-lg">
          <Database className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            {volumes.length === 0 ? "No volumes" : "No matching volumes"}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((vol) => (
            <Card key={vol.name}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-medium truncate">{vol.name}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {vol.mountpoint}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {vol.driver}
                  </Badge>
                  {vol.inUse && (
                    <Badge variant="secondary" className="text-xs shrink-0">In Use</Badge>
                  )}
                  <span className="text-xs text-muted-foreground shrink-0">
                    {vol.createdAt ? new Date(vol.createdAt).toLocaleDateString() : ""}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteDialog(vol)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && (
        <p className="text-xs text-muted-foreground text-center">
          {filtered.length} volume{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Volume</DialogTitle>
            <DialogDescription>
              Create a new Docker-managed named volume for persistent storage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="vol-name">Volume Name</Label>
            <Input
              id="vol-name"
              placeholder="my-volume"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteDialog !== null} onOpenChange={(o) => !o && setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Volume</DialogTitle>
            <DialogDescription>
              Remove <span className="font-semibold text-foreground font-mono">{deleteDialog?.name}</span>?
              {deleteDialog?.inUse
                ? " This volume is in use and cannot be removed until all containers using it are removed."
                : " All data stored in this volume will be permanently deleted."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
