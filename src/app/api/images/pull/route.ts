import { NextRequest } from "next/server";
import { getDocker } from "@/lib/docker";

export async function POST(request: NextRequest) {
  try {
    const docker = getDocker();
    const { image } = await request.json();

    if (!image || typeof image !== "string") {
      return Response.json(
        { error: "Image name is required" },
        { status: 400 },
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        docker.pull(image, (err: Error | null, pullStream: NodeJS.ReadableStream) => {
          if (err) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`),
            );
            controller.close();
            return;
          }

          docker.modem.followProgress(
            pullStream,
            // onFinished
            (err: Error | null) => {
              if (err) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`),
                );
              } else {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ status: "complete", image })}\n\n`),
                );
              }
              try {
                controller.close();
              } catch {
                // Already closed
              }
            },
            // onProgress
            (event: { status: string; progress?: string; id?: string }) => {
              try {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
                );
              } catch {
                // Controller closed
              }
            },
          );
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { error: "Failed to pull image", details: message },
      { status: 500 },
    );
  }
}
