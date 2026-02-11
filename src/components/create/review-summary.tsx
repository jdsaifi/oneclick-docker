"use client";

import { useState } from "react";
import {
  Box,
  Cpu,
  HardDrive,
  Globe,
  Key,
  Settings,
  Loader2,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileCode,
  Terminal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateFormStore } from "@/stores/create-form-store";
import { RESOURCE_TIERS } from "@/types/docker";
import { toDockerRunCommand, toDockerCompose } from "@/lib/export-config";
import { toast } from "sonner";

interface ReviewSummaryProps {
  onSubmit: () => void;
  isSubmitting: boolean;
  result: {
    id: string;
    name: string;
    image: string;
    ipAddress: string;
    gateway: string;
    ports: { container: number; host: number; protocol: string }[];
  } | null;
}

export function ReviewSummary({ onSubmit, isSubmitting, result }: ReviewSummaryProps) {
  const state = useCreateFormStore();
  const [showExport, setShowExport] = useState(false);

  const tier = RESOURCE_TIERS.find((t) => t.id === state.sizeId);
  const sizeLabel =
    state.sizeId === "custom"
      ? `${state.customCpus} CPU / ${state.customMemoryMB} MB`
      : tier
        ? tier.description
        : state.sizeId;

  const isValid = state.imageName !== "";
  const requiredEnvMissing = state.envVars.some((e) => e.required && !e.value);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  const dockerRun = isValid ? toDockerRunCommand(state) : "";
  const dockerCompose = isValid ? toDockerCompose(state) : "";

  // Show success state after creation
  if (result) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            Container Created Successfully
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow label="Name" value={result.name} />
            <InfoRow label="Image" value={result.image} />
            <InfoRow label="Container ID" value={result.id.slice(0, 12)} mono />
            {result.ipAddress && (
              <InfoRow label="IP Address" value={result.ipAddress} mono />
            )}
          </div>

          {result.ports.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Connection Details</p>
                <div className="space-y-2">
                  {result.ports
                    .filter((p) => p.host > 0)
                    .map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded bg-muted/50 font-mono text-sm"
                      >
                        <span>
                          localhost:{p.host} &rarr; :{p.container}/{p.protocol}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => copyToClipboard(`localhost:${p.host}`)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" asChild>
              <a href={`/containers/${result.id}`}>
                View Container <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/containers">All Containers</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Image */}
          <SummaryRow
            icon={Box}
            label="Image"
            value={
              state.imageName
                ? `${state.imageDisplayName || state.imageName}:${state.imageTag}`
                : "Not selected"
            }
            empty={!state.imageName}
          />

          {/* Size */}
          <SummaryRow icon={Cpu} label="Resources" value={sizeLabel} />

          {/* Volumes */}
          <SummaryRow
            icon={HardDrive}
            label="Volumes"
            value={
              state.volumes.length > 0
                ? `${state.volumes.length} volume${state.volumes.length > 1 ? "s" : ""}`
                : "None"
            }
          />

          {/* Ports */}
          <SummaryRow
            icon={Globe}
            label="Ports"
            value={
              state.ports.length > 0
                ? state.ports
                    .filter((p) => p.container > 0)
                    .map((p) => `${p.host}:${p.container}`)
                    .join(", ")
                : "None"
            }
          />

          {/* Env vars */}
          <SummaryRow
            icon={Key}
            label="Environment"
            value={
              state.envVars.length > 0
                ? `${state.envVars.length} variable${state.envVars.length > 1 ? "s" : ""}`
                : "None"
            }
          />

          {/* Advanced */}
          <SummaryRow
            icon={Settings}
            label="Restart"
            value={state.restartPolicy}
          />

          {state.containerName && (
            <SummaryRow icon={Settings} label="Name" value={state.containerName} />
          )}
        </CardContent>
      </Card>

      {requiredEnvMissing && (
        <p className="text-sm text-orange-400">
          Some required environment variables are missing values.
        </p>
      )}

      <div className="flex gap-2">
        <Button
          size="lg"
          className="flex-1"
          onClick={onSubmit}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Container...
            </>
          ) : (
            "Create Container"
          )}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => setShowExport(true)}
          disabled={!isValid}
          title="Export as docker run / docker-compose.yml"
        >
          <FileCode className="h-4 w-4" />
        </Button>
      </div>

      {/* Export Dialog */}
      <Dialog open={showExport} onOpenChange={setShowExport}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export Configuration</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="run">
            <TabsList className="w-full">
              <TabsTrigger value="run" className="flex-1 gap-1.5">
                <Terminal className="h-3.5 w-3.5" />
                docker run
              </TabsTrigger>
              <TabsTrigger value="compose" className="flex-1 gap-1.5">
                <FileCode className="h-3.5 w-3.5" />
                docker-compose.yml
              </TabsTrigger>
            </TabsList>
            <TabsContent value="run" className="mt-3">
              <div className="relative">
                <pre className="bg-muted p-4 rounded-md text-sm font-mono overflow-x-auto max-h-80 whitespace-pre-wrap break-all">
                  {dockerRun}
                </pre>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={() => copyToClipboard(dockerRun)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="compose" className="mt-3">
              <div className="relative">
                <pre className="bg-muted p-4 rounded-md text-sm font-mono overflow-x-auto max-h-80 whitespace-pre">
                  {dockerCompose}
                </pre>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={() => copyToClipboard(dockerCompose)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  empty,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  empty?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <Badge
        variant={empty ? "outline" : "secondary"}
        className={`font-mono text-xs ${empty ? "text-muted-foreground" : ""}`}
      >
        {value}
      </Badge>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
