"use client";

import { useState, useEffect, useRef } from "react";
import {
  Box,
  Cpu,
  HardDrive,
  Globe,
  Key,
  Settings,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePicker } from "@/components/create/image-picker";
import { SizeSelector } from "@/components/create/size-selector";
import { VolumeConfig } from "@/components/create/volume-config";
import { NetworkConfig } from "@/components/create/network-config";
import { EnvConfig } from "@/components/create/env-config";
import { AdvancedConfig } from "@/components/create/advanced-config";
import { ReviewSummary } from "@/components/create/review-summary";
import { useCreateFormStore } from "@/stores/create-form-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const sections = [
  { id: "image", label: "Image", icon: Box },
  { id: "size", label: "Resources", icon: Cpu },
  { id: "volumes", label: "Volumes", icon: HardDrive },
  { id: "network", label: "Network & Ports", icon: Globe },
  { id: "env", label: "Environment", icon: Key },
  { id: "advanced", label: "Advanced", icon: Settings },
  { id: "review", label: "Review & Create", icon: CheckCircle2 },
];

interface CreateResult {
  id: string;
  name: string;
  image: string;
  ipAddress: string;
  gateway: string;
  ports: { container: number; host: number; protocol: string }[];
}

export default function CreateContainerPage() {
  const store = useCreateFormStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CreateResult | null>(null);
  const [activeSection, setActiveSection] = useState("image");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Reset form on mount
  useEffect(() => {
    store.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );

    for (const ref of Object.values(sectionRefs.current)) {
      if (ref) observer.observe(ref);
    }

    return () => observer.disconnect();
  }, []);

  function scrollToSection(id: string) {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit() {
    if (!store.imageName) {
      toast.error("Please select an image");
      scrollToSection("image");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/containers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: store.imageName,
          tag: store.imageTag,
          name: store.containerName || undefined,
          ports: store.ports,
          volumes: store.volumes,
          env: store.envVars.filter((e) => e.key),
          sizeId: store.sizeId,
          customCpus: store.customCpus,
          customMemoryMB: store.customMemoryMB,
          networkMode: store.networkMode,
          restartPolicy: store.restartPolicy,
          hostname: store.hostname || undefined,
          command: store.command || undefined,
          labels: store.labels.filter((l) => l.key),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.details || data.error || "Failed to create container");
      }

      setResult(data.container);
      toast.success(`Container "${data.container.name}" created and started`);
      scrollToSection("review");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create container");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/containers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Container</h1>
          <p className="text-muted-foreground mt-1">
            Configure and launch a new Docker container
          </p>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sticky progress nav */}
        <nav className="hidden lg:block w-48 shrink-0">
          <div className="sticky top-24 space-y-1">
            {sections.map((section, i) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm transition-colors text-left",
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  <span className="flex items-center justify-center h-5 w-5 rounded-full border text-xs shrink-0">
                    {i + 1}
                  </span>
                  {section.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Form sections */}
        <div className="flex-1 min-w-0 space-y-6 pb-12">
          <FormSection
            ref={(el) => { sectionRefs.current.image = el; }}
            id="image"
            number={1}
            title="Choose Image"
            description="Select a base image for your container"
          >
            <ImagePicker />
          </FormSection>

          <FormSection
            ref={(el) => { sectionRefs.current.size = el; }}
            id="size"
            number={2}
            title="Choose Size"
            description="Set CPU and memory limits"
          >
            <SizeSelector />
          </FormSection>

          <FormSection
            ref={(el) => { sectionRefs.current.volumes = el; }}
            id="volumes"
            number={3}
            title="Volumes"
            description="Configure persistent storage"
          >
            <VolumeConfig />
          </FormSection>

          <FormSection
            ref={(el) => { sectionRefs.current.network = el; }}
            id="network"
            number={4}
            title="Network & Ports"
            description="Configure port mappings and networking"
          >
            <NetworkConfig />
          </FormSection>

          <FormSection
            ref={(el) => { sectionRefs.current.env = el; }}
            id="env"
            number={5}
            title="Environment Variables"
            description="Set configuration values"
          >
            <EnvConfig />
          </FormSection>

          <FormSection
            ref={(el) => { sectionRefs.current.advanced = el; }}
            id="advanced"
            number={6}
            title="Additional Settings"
            description="Container name, restart policy, and more"
          >
            <AdvancedConfig />
          </FormSection>

          <div
            ref={(el) => { sectionRefs.current.review = el; }}
            id="review"
            className="scroll-mt-24"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                7
              </span>
              <div>
                <h2 className="text-xl font-semibold">Review & Create</h2>
                <p className="text-sm text-muted-foreground">
                  Confirm your configuration and create the container
                </p>
              </div>
            </div>
            <ReviewSummary
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              result={result}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import { forwardRef } from "react";

const FormSection = forwardRef<
  HTMLDivElement,
  {
    id: string;
    number: number;
    title: string;
    description: string;
    children: React.ReactNode;
  }
>(function FormSection({ id, number, title, description, children }, ref) {
  return (
    <div ref={ref} id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-4">
        <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm font-medium">
          {number}
        </span>
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">{children}</CardContent>
      </Card>
    </div>
  );
});
