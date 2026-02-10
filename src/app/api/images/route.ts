import { NextResponse } from "next/server";
import { getDocker } from "@/lib/docker";

export async function GET() {
  try {
    const docker = getDocker();
    const images = await docker.listImages({ all: false });

    const parsed = images.map((img) => ({
      id: img.Id,
      repoTags: img.RepoTags ?? [],
      repoDigests: img.RepoDigests ?? [],
      created: img.Created,
      size: img.Size,
      virtualSize: img.VirtualSize,
      labels: img.Labels ?? {},
    }));

    // Sort by created descending
    parsed.sort((a, b) => b.created - a.created);

    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to list images", details: message },
      { status: 500 },
    );
  }
}
