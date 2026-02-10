"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  Download,
  Trash2,
  ArrowDownToLine,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useContainerLogs, type LogEntry } from "@/hooks/use-container-logs";

export function ContainerLogs({
  containerId,
  isRunning,
}: {
  containerId: string;
  isRunning: boolean;
}) {
  const { logs, connected, clear, reconnect } = useContainerLogs(
    containerId,
    isRunning,
  );
  const [search, setSearch] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [showStderr, setShowStderr] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const filtered = logs.filter((entry) => {
    if (!showStderr && entry.stream === "stderr") return false;
    if (search && !entry.text.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  function handleDownload() {
    const text = logs.map((e) => `[${e.stream}] ${e.text}`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `container-${containerId.slice(0, 12)}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-scroll"
              checked={autoScroll}
              onCheckedChange={setAutoScroll}
            />
            <Label htmlFor="auto-scroll" className="text-xs">
              Auto-scroll
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="show-stderr"
              checked={showStderr}
              onCheckedChange={setShowStderr}
            />
            <Label htmlFor="show-stderr" className="text-xs">
              stderr
            </Label>
          </div>

          <Badge
            variant={connected ? "default" : "secondary"}
            className="gap-1 text-xs"
          >
            {connected ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {connected ? "Live" : "Disconnected"}
          </Badge>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDownload}
              title="Download logs"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={clear}
              title="Clear logs"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {!connected && isRunning && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={reconnect}
                title="Reconnect"
              >
                <ArrowDownToLine className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Log output */}
      <div className="bg-black rounded-lg border border-border overflow-hidden">
        <ScrollArea className="h-[500px]">
          <div className="p-4 font-mono text-xs leading-relaxed">
            {filtered.length === 0 && (
              <p className="text-muted-foreground">
                {logs.length === 0
                  ? isRunning
                    ? "Waiting for logs..."
                    : "No logs available. Container is not running."
                  : "No matching log lines."}
              </p>
            )}
            {filtered.map((entry, i) => (
              <div
                key={i}
                className={`whitespace-pre-wrap break-all ${
                  entry.stream === "stderr"
                    ? "text-red-400"
                    : "text-gray-300"
                }`}
              >
                {entry.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {filtered.length} lines
        {filtered.length !== logs.length && ` (${logs.length} total)`}
      </p>
    </div>
  );
}
