"use client";

import { useState } from "react";
import {
  Search,
  Trash2,
  Download,
  Loader2,
  Container,
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
import type { DockerImage } from "@/hooks/use-docker-images";
import { formatBytes } from "@/lib/format";
import { toast } from "sonner";

interface ImageListProps {
  images: DockerImage[];
  loading: boolean;
  error: string | null;
  onRefetch: () => void;
}

export function ImageList({ images, loading, error, onRefetch }: ImageListProps) {
  const [search, setSearch] = useState("");
  const [pullImage, setPullImage] = useState("");
  const [pulling, setPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = images.filter((img) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      img.repoTags.some((t) => t.toLowerCase().includes(q)) ||
      img.id.toLowerCase().includes(q)
    );
  });

  async function handlePull() {
    if (!pullImage.trim()) return;
    setPulling(true);
    setPullProgress("Connecting...");

    try {
      const res = await fetch("/api/images/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: pullImage.trim() }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.details || body.error || "Failed to pull");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          const lines = text.split("\n").filter((l) => l.startsWith("data: "));
          for (const line of lines) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.status === "complete") {
                toast.success(`Pulled ${pullImage.trim()}`);
              } else {
                setPullProgress(
                  parsed.progress
                    ? `${parsed.status} ${parsed.id ?? ""}: ${parsed.progress}`
                    : parsed.status,
                );
              }
            } catch (e) {
              if (e instanceof Error && e.message !== data) throw e;
            }
          }
        }
      }

      setPullImage("");
      onRefetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to pull image");
    } finally {
      setPulling(false);
      setPullProgress("");
    }
  }

  async function handleDelete() {
    if (!deleteDialog) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/images/${encodeURIComponent(deleteDialog.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.details || body.error || "Failed to remove");
      }
      toast.success(`Removed ${deleteDialog.name}`);
      setDeleteDialog(null);
      onRefetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove image");
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
            placeholder="Search images..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="nginx:latest"
            value={pullImage}
            onChange={(e) => setPullImage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePull()}
            className="w-48 sm:w-64"
            disabled={pulling}
          />
          <Button onClick={handlePull} disabled={pulling || !pullImage.trim()}>
            {pulling ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1.5" />
            )}
            Pull
          </Button>
        </div>
      </div>

      {/* Pull progress */}
      {pullProgress && (
        <div className="p-3 rounded-lg bg-muted/50 border border-border text-sm font-mono truncate">
          {pullProgress}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-4">
                  <div className="h-5 w-48 bg-muted animate-pulse rounded" />
                  <div className="h-5 w-20 bg-muted animate-pulse rounded" />
                  <div className="ml-auto h-5 w-16 bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 border border-dashed border-border rounded-lg">
          <Container className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            {images.length === 0 ? "No images found" : "No matching images"}
          </p>
        </div>
      )}

      {/* Image list */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((img) => {
            const mainTag = img.repoTags[0] ?? "<none>:<none>";
            const extraTags = img.repoTags.slice(1);
            return (
              <Card key={img.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm font-medium truncate">
                        {mainTag}
                      </p>
                      {extraTags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {extraTags.map((t) => (
                            <Badge key={t} variant="outline" className="text-[10px] font-mono">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs font-mono shrink-0">
                      {formatBytes(img.size)}
                    </Badge>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(img.created * 1000).toLocaleDateString()}
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
                          onClick={() =>
                            setDeleteDialog({ id: img.id, name: mainTag })
                          }
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && (
        <p className="text-xs text-muted-foreground text-center">
          {filtered.length} image{filtered.length !== 1 ? "s" : ""}
          {filtered.length !== images.length && ` of ${images.length} total`}
        </p>
      )}

      {/* Delete dialog */}
      <Dialog open={deleteDialog !== null} onOpenChange={(o) => !o && setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Image</DialogTitle>
            <DialogDescription>
              Remove <span className="font-semibold text-foreground font-mono">{deleteDialog?.name}</span>?
              This cannot be undone. Images in use by containers cannot be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Cancel
            </Button>
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
