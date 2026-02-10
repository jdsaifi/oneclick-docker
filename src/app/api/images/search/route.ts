import { NextRequest, NextResponse } from "next/server";
import { getDocker } from "@/lib/docker";

export async function GET(request: NextRequest) {
  try {
    const term = request.nextUrl.searchParams.get("q");
    if (!term) {
      return NextResponse.json(
        { error: "Search query parameter 'q' is required" },
        { status: 400 },
      );
    }

    const docker = getDocker();
    const results = await docker.searchImages({ term, limit: 25 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = results.map((r: any) => ({
      name: r.name,
      description: r.description,
      stars: r.star_count,
      official: r.is_official,
      automated: r.is_automated,
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to search images", details: message },
      { status: 500 },
    );
  }
}
