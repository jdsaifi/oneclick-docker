import { NextRequest, NextResponse } from "next/server";
import { getDocker } from "@/lib/docker";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const docker = getDocker();
    const container = docker.getContainer(id);
    await container.restart();

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to restart container", details: message },
      { status: 500 },
    );
  }
}
