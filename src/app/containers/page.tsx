"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContainerList } from "@/components/containers/container-list";
import { useContainers } from "@/hooks/use-containers";

export default function ContainersPage() {
  const { containers, loading, error, performAction } = useContainers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Containers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your Docker containers
          </p>
        </div>
        <Button asChild>
          <Link href="/containers/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Container
          </Link>
        </Button>
      </div>

      <ContainerList
        containers={containers}
        loading={loading}
        error={error}
        onAction={performAction}
      />
    </div>
  );
}
