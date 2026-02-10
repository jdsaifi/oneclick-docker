import { NextRequest } from "next/server";
import { getDocker } from "@/lib/docker";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const tail = searchParams.get("tail") ?? "200";
  const follow = searchParams.get("follow") !== "false";

  try {
    const docker = getDocker();
    const container = docker.getContainer(id);

    // Verify container exists
    await container.inspect();

    const logOpts = {
      follow,
      stdout: true,
      stderr: true,
      tail: parseInt(tail, 10),
      timestamps: true,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logStream: any = await container.logs(logOpts as any);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        // Docker multiplexed stream: 8-byte header per frame
        // byte 0: stream type (1=stdout, 2=stderr)
        // bytes 4-7: frame size (big-endian uint32)
        // followed by frame payload
        if (typeof logStream.on === "function") {
          logStream.on("data", (chunk: Buffer) => {
            const lines = demuxDockerStream(chunk);
            for (const line of lines) {
              try {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(line)}\n\n`),
                );
              } catch {
                // Controller closed
              }
            }
          });

          logStream.on("end", () => {
            try {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            } catch {
              // Already closed
            }
          });

          logStream.on("error", () => {
            try {
              controller.close();
            } catch {
              // Already closed
            }
          });

          // Close stream when client disconnects
          request.signal.addEventListener("abort", () => {
            try {
              if (typeof logStream.destroy === "function") {
                logStream.destroy();
              }
            } catch {
              // Ignore
            }
          });
        } else {
          // Non-streaming response (container not running)
          const text =
            typeof logStream === "string"
              ? logStream
              : logStream.toString("utf-8");
          const lines = text.split("\n").filter(Boolean);
          for (const line of lines) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ stream: "stdout", text: line })}\n\n`,
              ),
            );
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
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
      { error: "Failed to get logs", details: message },
      { status: 500 },
    );
  }
}

function demuxDockerStream(
  chunk: Buffer,
): { stream: "stdout" | "stderr"; text: string }[] {
  const results: { stream: "stdout" | "stderr"; text: string }[] = [];
  let offset = 0;

  while (offset < chunk.length) {
    if (offset + 8 > chunk.length) {
      // Incomplete header — treat rest as raw text
      const text = chunk.subarray(offset).toString("utf-8").trim();
      if (text) results.push({ stream: "stdout", text });
      break;
    }

    const streamType = chunk[offset];
    const frameSize = chunk.readUInt32BE(offset + 4);
    offset += 8;

    if (offset + frameSize > chunk.length) {
      const text = chunk.subarray(offset).toString("utf-8").trim();
      if (text) {
        results.push({
          stream: streamType === 2 ? "stderr" : "stdout",
          text,
        });
      }
      break;
    }

    const text = chunk.subarray(offset, offset + frameSize).toString("utf-8").trim();
    if (text) {
      results.push({
        stream: streamType === 2 ? "stderr" : "stdout",
        text,
      });
    }

    offset += frameSize;
  }

  return results;
}
