import { NextRequest, NextResponse } from "next/server";
import { getDocker } from "@/lib/docker";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const docker = getDocker();
    const image = docker.getImage(decodeURIComponent(id));
    await image.remove({ force: false });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("in use") || message.includes("conflict") ? 409 : 500;
    return NextResponse.json(
      { error: "Failed to remove image", details: message },
      { status },
    );
  }
}
