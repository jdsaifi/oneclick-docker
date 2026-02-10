"use client";

import { Plus, Trash2, HardDrive, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateFormStore } from "@/stores/create-form-store";

export function VolumeConfig() {
  const { volumes, addVolume, updateVolume, removeVolume } = useCreateFormStore();

  return (
    <div className="space-y-4">
      {volumes.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No volumes configured. Data will be lost when the container is removed.
        </p>
      )}

      {volumes.map((vol, i) => (
        <div
          key={i}
          className="flex flex-col sm:flex-row gap-3 p-3 rounded-lg bg-muted/30 border border-border"
        >
          <div className="flex items-center gap-2 sm:w-32">
            <Select
              value={vol.type}
              onValueChange={(v) =>
                updateVolume(i, { type: v as "volume" | "bind" })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="volume">
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="h-3 w-3" /> Volume
                  </span>
                </SelectItem>
                <SelectItem value="bind">
                  <span className="flex items-center gap-1.5">
                    <FolderOpen className="h-3 w-3" /> Bind
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {vol.type === "volume" ? (
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Volume Name</Label>
              <Input
                placeholder="my-volume"
                value={vol.name}
                onChange={(e) => updateVolume(i, { name: e.target.value })}
                className="h-9"
              />
            </div>
          ) : (
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Host Path</Label>
              <Input
                placeholder="/host/path"
                value={vol.hostPath ?? ""}
                onChange={(e) => updateVolume(i, { hostPath: e.target.value })}
                className="h-9"
              />
            </div>
          )}

          <div className="flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Container Path</Label>
            <Input
              placeholder="/container/path"
              value={vol.containerPath}
              onChange={(e) => updateVolume(i, { containerPath: e.target.value })}
              className="h-9"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 self-end text-muted-foreground hover:text-destructive"
            onClick={() => removeVolume(i)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {volumes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {volumes
            .filter((v) => v.containerPath)
            .map((v, i) => (
              <Badge key={i} variant="outline" className="text-xs font-mono">
                {v.type === "volume" ? v.name : v.hostPath} : {v.containerPath}
              </Badge>
            ))}
        </div>
      )}

      <Button variant="outline" size="sm" onClick={addVolume}>
        <Plus className="h-4 w-4 mr-1.5" />
        Add Volume
      </Button>
    </div>
  );
}
