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
    await container.start();

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("already started") ? 304 : 500;
    return NextResponse.json(
      { error: "Failed to start container", details: message },
      { status },
    );
  }
}
