import { NextRequest, NextResponse } from "next/server";
import { getDocker } from "@/lib/docker";
import { getCatalogDefaults, parseImageInspect } from "@/lib/smart-defaults";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const imageName = decodeURIComponent(id);

    // Check catalog first
    const catalogDefaults = getCatalogDefaults(imageName);
    if (catalogDefaults) {
      return NextResponse.json({
        source: "catalog",
        defaults: catalogDefaults,
      });
    }

    // Fall back to inspecting the actual image
    const docker = getDocker();
    const image = docker.getImage(imageName);
    const info = await image.inspect();

    const defaults = parseImageInspect({
      ExposedPorts: info.Config?.ExposedPorts,
      Volumes: info.Config?.Volumes,
      Env: info.Config?.Env,
    });

    return NextResponse.json({
      source: "inspect",
      defaults,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to inspect image", details: message },
      { status: 404 },
    );
  }
}
