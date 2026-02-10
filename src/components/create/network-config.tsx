"use client";

import { Plus, Trash2, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateFormStore } from "@/stores/create-form-store";

export function NetworkConfig() {
  const { ports, addPort, updatePort, removePort, networkMode, setNetworkMode } =
    useCreateFormStore();

  return (
    <div className="space-y-6">
      {/* Ports */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Port Mappings</Label>

        {ports.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">
            No ports published. The container will not be accessible from the host.
          </p>
        )}

        {ports.map((port, i) => (
          <div
            key={i}
            className="flex items-end gap-2"
          >
            <div className="flex-1 space-y-1">
              {i === 0 && (
                <Label className="text-xs text-muted-foreground">Host Port</Label>
              )}
              <Input
                type="number"
                placeholder="8080"
                min={0}
                max={65535}
                value={port.host || ""}
                onChange={(e) =>
                  updatePort(i, { host: parseInt(e.target.value) || 0 })
                }
                className="h-9"
              />
            </div>

            <div className="flex items-center pb-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex-1 space-y-1">
              {i === 0 && (
                <Label className="text-xs text-muted-foreground">Container Port</Label>
              )}
              <Input
                type="number"
                placeholder="80"
                min={0}
                max={65535}
                value={port.container || ""}
                onChange={(e) =>
                  updatePort(i, { container: parseInt(e.target.value) || 0 })
                }
                className="h-9"
              />
            </div>

            <div className="w-20 space-y-1">
              {i === 0 && (
                <Label className="text-xs text-muted-foreground">Proto</Label>
              )}
              <Select
                value={port.protocol}
                onValueChange={(v) =>
                  updatePort(i, { protocol: v as "tcp" | "udp" })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tcp">TCP</SelectItem>
                  <SelectItem value="udp">UDP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removePort(i)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={addPort}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Port
        </Button>
      </div>

      {/* Network Mode */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Network Mode</Label>
        <Select value={networkMode} onValueChange={setNetworkMode}>
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bridge">Bridge (default)</SelectItem>
            <SelectItem value="host">Host</SelectItem>
            <SelectItem value="none">None</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {networkMode === "bridge" && "Container gets its own network, ports must be published explicitly."}
          {networkMode === "host" && "Container shares the host network. Port mappings are ignored."}
          {networkMode === "none" && "Container has no network access."}
        </p>
      </div>
    </div>
  );
}
