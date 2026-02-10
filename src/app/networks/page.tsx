"use client";

import { NetworkList } from "@/components/networks/network-list";

export default function NetworksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Networks</h1>
        <p className="text-muted-foreground mt-1">Manage container networks</p>
      </div>
      <NetworkList />
    </div>
  );
}
