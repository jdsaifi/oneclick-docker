import { NextRequest, NextResponse } from "next/server";
import { getDocker } from "@/lib/docker";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params;
    const docker = getDocker();
    const volume = docker.getVolume(decodeURIComponent(name));
    await volume.remove();

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("in use") ? 409 : 500;
    return NextResponse.json(
      { error: "Failed to remove volume", details: message },
      { status },
    );
  }
}
