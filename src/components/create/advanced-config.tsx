"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateFormStore } from "@/stores/create-form-store";

export function AdvancedConfig() {
  const {
    containerName,
    setContainerName,
    restartPolicy,
    setRestartPolicy,
    hostname,
    setHostname,
    command,
    setCommand,
    labels,
    addLabel,
    updateLabel,
    removeLabel,
  } = useCreateFormStore();

  return (
    <div className="space-y-5">
      {/* Container Name */}
      <div className="space-y-2">
        <Label htmlFor="container-name">Container Name</Label>
        <Input
          id="container-name"
          placeholder="my-container (auto-generated if empty)"
          value={containerName}
          onChange={(e) => setContainerName(e.target.value)}
        />
      </div>

      {/* Restart Policy */}
      <div className="space-y-2">
        <Label>Restart Policy</Label>
        <Select
          value={restartPolicy}
          onValueChange={(v) =>
            setRestartPolicy(v as "no" | "unless-stopped" | "always" | "on-failure")
          }
        >
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no">Don&apos;t restart</SelectItem>
            <SelectItem value="unless-stopped">Unless stopped (recommended)</SelectItem>
            <SelectItem value="always">Always restart</SelectItem>
            <SelectItem value="on-failure">Restart on failure (max 5 retries)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Hostname */}
      <div className="space-y-2">
        <Label htmlFor="hostname">Hostname</Label>
        <Input
          id="hostname"
          placeholder="Optional hostname"
          value={hostname}
          onChange={(e) => setHostname(e.target.value)}
        />
      </div>

      {/* Command Override */}
      <div className="space-y-2">
        <Label htmlFor="command">Command Override</Label>
        <Textarea
          id="command"
          placeholder="Override the default command (optional)"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          rows={2}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Leave empty to use the image&apos;s default command.
        </p>
      </div>

      {/* Labels */}
      <div className="space-y-3">
        <Label>Labels</Label>
        {labels.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              placeholder="key"
              value={label.key}
              onChange={(e) => updateLabel(i, { key: e.target.value })}
              className="h-9 flex-1 font-mono text-sm"
            />
            <span className="text-muted-foreground">=</span>
            <Input
              placeholder="value"
              value={label.value}
              onChange={(e) => updateLabel(i, { value: e.target.value })}
              className="h-9 flex-1 font-mono text-sm"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeLabel(i)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addLabel}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Label
        </Button>
      </div>
    </div>
  );
}
