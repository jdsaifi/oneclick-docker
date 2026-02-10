import { NextResponse } from "next/server";
import { getDocker } from "@/lib/docker";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const docker = getDocker();
    const network = docker.getNetwork(id);
    await network.remove();

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("is a pre-defined network") ? 400 : 500;
    return NextResponse.json(
      { error: "Failed to remove network", details: message },
      { status },
    );
  }
}
