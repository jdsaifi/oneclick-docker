"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Trash2,
  Plus,
  Loader2,
  Network,
  MoreVertical,
  Box,
  Shield,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface NetworkInfo {
  id: string;
  name: string;
  driver: string;
  scope: string;
  internal: boolean;
  ipam: { subnet: string; gateway: string }[];
  containers: { id: string; name: string }[];
  createdAt: string;
  builtIn: boolean;
}

export function NetworkList() {
  const [networks, setNetworks] = useState<NetworkInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDriver, setNewDriver] = useState("bridge");
  const [newSubnet, setNewSubnet] = useState("");
  const [newGateway, setNewGateway] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<NetworkInfo | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchNetworks = useCallback(async () => {
    try {
      const res = await fetch("/api/networks");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setNetworks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNetworks();
  }, [fetchNetworks]);

  const filtered = networks.filter(
    (n) => !search || n.name.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/networks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          driver: newDriver,
          subnet: newSubnet.trim() || undefined,
          gateway: newGateway.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.details || body.error);
      }
      toast.success(`Network "${newName.trim()}" created`);
      setNewName("");
      setNewSubnet("");
      setNewGateway("");
      setNewDriver("bridge");
      setShowCreate(false);
      fetchNetworks();
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
      const res = await fetch(`/api/networks/${encodeURIComponent(deleteDialog.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.details || body.error);
      }
      toast.success(`Network "${deleteDialog.name}" removed`);
      setDeleteDialog(null);
      fetchNetworks();
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
            placeholder="Search networks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Create Network
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
          <Network className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            {networks.length === 0 ? "No networks" : "No matching networks"}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((net) => (
            <Card key={net.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm font-medium truncate">{net.name}</p>
                      {net.builtIn && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          Built-in
                        </Badge>
                      )}
                      {net.internal && (
                        <Badge variant="secondary" className="text-xs shrink-0 gap-1">
                          <Shield className="h-3 w-3" />
                          Internal
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>Driver: {net.driver}</span>
                      <span>Scope: {net.scope}</span>
                      {net.ipam.length > 0 && net.ipam[0].subnet && (
                        <span>Subnet: {net.ipam[0].subnet}</span>
                      )}
                    </div>
                    {net.containers.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <Box className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {net.containers.map((c) => (
                          <Badge key={c.id} variant="secondary" className="text-xs">
                            {c.name || c.id}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {net.createdAt ? new Date(net.createdAt).toLocaleDateString() : ""}
                  </span>
                  {!net.builtIn && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteDialog(net)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && (
        <p className="text-xs text-muted-foreground text-center">
          {filtered.length} network{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Network</DialogTitle>
            <DialogDescription>
              Create a new Docker network for container communication.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="net-name">Network Name</Label>
              <Input
                id="net-name"
                placeholder="my-network"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="net-driver">Driver</Label>
              <Select value={newDriver} onValueChange={setNewDriver}>
                <SelectTrigger id="net-driver">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bridge">bridge</SelectItem>
                  <SelectItem value="overlay">overlay</SelectItem>
                  <SelectItem value="macvlan">macvlan</SelectItem>
                  <SelectItem value="ipvlan">ipvlan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="net-subnet">Subnet (optional)</Label>
              <Input
                id="net-subnet"
                placeholder="172.20.0.0/16"
                value={newSubnet}
                onChange={(e) => setNewSubnet(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="net-gateway">Gateway (optional)</Label>
              <Input
                id="net-gateway"
                placeholder="172.20.0.1"
                value={newGateway}
                onChange={(e) => setNewGateway(e.target.value)}
              />
            </div>
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
            <DialogTitle>Remove Network</DialogTitle>
            <DialogDescription>
              Remove <span className="font-semibold text-foreground font-mono">{deleteDialog?.name}</span>?
              {deleteDialog && deleteDialog.containers.length > 0
                ? ` This network has ${deleteDialog.containers.length} connected container${deleteDialog.containers.length !== 1 ? "s" : ""}. They will be disconnected.`
                : " This action cannot be undone."}
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
