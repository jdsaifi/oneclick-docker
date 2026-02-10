"use client";

import { Plus, Trash2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCreateFormStore } from "@/stores/create-form-store";

export function EnvConfig() {
  const { envVars, addEnvVar, updateEnvVar, removeEnvVar } = useCreateFormStore();
  const [visibleSecrets, setVisibleSecrets] = useState<Set<number>>(new Set());

  function toggleVisibility(index: number) {
    setVisibleSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  const requiredEmpty = envVars.filter((e) => e.required && !e.value);

  return (
    <div className="space-y-4">
      {requiredEmpty.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-sm">
          <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
          <p className="text-orange-400">
            {requiredEmpty.length} required variable{requiredEmpty.length > 1 ? "s" : ""} need a value:{" "}
            {requiredEmpty.map((e) => e.key).join(", ")}
          </p>
        </div>
      )}

      {envVars.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No environment variables configured.
        </p>
      )}

      {envVars.map((env, i) => (
        <div key={i} className="space-y-1.5">
          {env.description && (
            <p className="text-xs text-muted-foreground">{env.description}</p>
          )}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                placeholder="KEY"
                value={env.key}
                onChange={(e) => updateEnvVar(i, { key: e.target.value })}
                className="h-9 font-mono text-sm"
              />
            </div>
            <span className="text-muted-foreground">=</span>
            <div className="flex-1 relative">
              <Input
                type={env.secret && !visibleSecrets.has(i) ? "password" : "text"}
                placeholder="value"
                value={env.value}
                onChange={(e) => updateEnvVar(i, { value: e.target.value })}
                className="h-9 font-mono text-sm pr-9"
              />
              {env.secret && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9 w-9"
                  onClick={() => toggleVisibility(i)}
                >
                  {visibleSecrets.has(i) ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-1">
              {env.required && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-orange-400 border-orange-500/30">
                  required
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeEnvVar(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={addEnvVar}>
        <Plus className="h-4 w-4 mr-1.5" />
        Add Variable
      </Button>
    </div>
  );
}
