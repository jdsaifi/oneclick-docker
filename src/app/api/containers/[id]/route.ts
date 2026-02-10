import { NextRequest, NextResponse } from "next/server";
import { getDocker } from "@/lib/docker";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const docker = getDocker();
    const container = docker.getContainer(id);
    const info = await container.inspect();

    return NextResponse.json(info);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("no such container") ? 404 : 500;
    return NextResponse.json(
      { error: "Failed to get container", details: message },
      { status },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const docker = getDocker();
    const container = docker.getContainer(id);

    // Stop if running before removing
    const info = await container.inspect();
    if (info.State.Running) {
      await container.stop();
    }

    await container.remove();

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to remove container", details: message },
      { status: 500 },
    );
  }
}
