"use client";

import { Cpu, MemoryStick } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RESOURCE_TIERS } from "@/types/docker";
import { useCreateFormStore } from "@/stores/create-form-store";
import { cn } from "@/lib/utils";

export function SizeSelector() {
  const { sizeId, setSize, customCpus, customMemoryMB, setCustomCpus, setCustomMemoryMB } =
    useCreateFormStore();

  const allOptions = [
    ...RESOURCE_TIERS,
    { id: "custom", name: "Custom", cpus: 0, memory: 0, description: "Set your own limits" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {allOptions.map((tier) => {
          const isSelected = sizeId === tier.id;
          return (
            <Card
              key={tier.id}
              className={cn(
                "cursor-pointer transition-all",
                isSelected
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-muted/50",
              )}
              onClick={() => setSize(tier.id)}
            >
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">{tier.name}</p>
                  {isSelected && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {tier.description}
                </p>
                {tier.id !== "custom" && (
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Cpu className="h-3 w-3" />
                      {tier.cpus} CPU
                    </span>
                    <span className="flex items-center gap-1">
                      <MemoryStick className="h-3 w-3" />
                      {tier.memory >= 1024 * 1024 * 1024
                        ? `${tier.memory / (1024 * 1024 * 1024)} GB`
                        : `${tier.memory / (1024 * 1024)} MB`}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Custom inputs */}
      {sizeId === "custom" && (
        <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex-1 space-y-2">
            <Label htmlFor="custom-cpus" className="flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5" /> CPU Cores
            </Label>
            <Input
              id="custom-cpus"
              type="number"
              min={0.25}
              max={16}
              step={0.25}
              value={customCpus}
              onChange={(e) => setCustomCpus(parseFloat(e.target.value) || 1)}
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="custom-memory" className="flex items-center gap-1.5">
              <MemoryStick className="h-3.5 w-3.5" /> Memory (MB)
            </Label>
            <Input
              id="custom-memory"
              type="number"
              min={64}
              max={32768}
              step={64}
              value={customMemoryMB}
              onChange={(e) => setCustomMemoryMB(parseInt(e.target.value) || 1024)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
