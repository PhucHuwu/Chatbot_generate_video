import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy endpoint to download video files from external URLs.
 * Bypasses CORS issues on mobile browsers (iOS Safari, etc.) by fetching server-side
 * and returning the blob with Content-Disposition: attachment header.
 *
 * Usage: GET /api/download?url=https://...
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const videoUrl = searchParams.get("url");

        if (!videoUrl) {
            return NextResponse.json({ error: "Missing 'url' query parameter" }, { status: 400 });
        }

        // Validate URL format
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(videoUrl);
            if (!parsedUrl.protocol.startsWith("http")) {
                throw new Error("Invalid protocol");
            }
        } catch (e) {
            return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
        }

        // Fetch the video from the external URL (server-side, no CORS issues)
        const response = await fetch(videoUrl, {
            method: "GET",
            headers: {
                // Optional: add user-agent to mimic browser request
                "User-Agent": "Mozilla/5.0 (compatible; VideoDownloadProxy/1.0)",
            },
        });

        if (!response.ok) {
            console.error(`Failed to fetch video: ${response.status} ${response.statusText}`);
            return NextResponse.json(
                {
                    error: `Failed to fetch video: ${response.status} ${response.statusText}`,
                },
                { status: response.status }
            );
        }

        // Extract filename from URL pathname or default to 'video.mp4'
        let filename = "video.mp4";
        try {
            const pathname = parsedUrl.pathname;
            const parts = pathname.split("/");
            const lastPart = parts[parts.length - 1];
            if (lastPart && lastPart.includes(".")) {
                filename = lastPart;
            }
        } catch (e) {
            // ignore, use default
        }

        // Get the video blob
        const blob = await response.blob();

        // Return the blob with Content-Disposition header to trigger download
        return new NextResponse(blob, {
            status: 200,
            headers: {
                "Content-Type": response.headers.get("Content-Type") || "video/mp4",
                "Content-Disposition": `attachment; filename="${filename}"`,
                // Optional: add Content-Length if available
                ...(response.headers.get("Content-Length") && {
                    "Content-Length": response.headers.get("Content-Length")!,
                }),
            },
        });
    } catch (error: any) {
        console.error("Download proxy error:", error);
        return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
    }
}
