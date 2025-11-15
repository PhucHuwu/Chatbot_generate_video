import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy endpoint to download video files with proper headers
 * Fixes iOS download issue by setting Content-Disposition header
 * Usage: GET /api/download?url=https://example.com/video.mp4
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const videoUrl = searchParams.get("url");

        if (!videoUrl) {
            return NextResponse.json({ error: "Missing 'url' parameter" }, { status: 400 });
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

        // Fetch the video from the external URL
        const videoResponse = await fetch(videoUrl);

        if (!videoResponse.ok) {
            return NextResponse.json(
                {
                    error: `Failed to fetch video: ${videoResponse.status} ${videoResponse.statusText}`,
                },
                { status: videoResponse.status }
            );
        }

        // Extract filename from URL or use default
        let filename = "video.mp4";
        try {
            const pathname = parsedUrl.pathname;
            const parts = pathname.split("/");
            const lastPart = parts[parts.length - 1];
            if (lastPart && lastPart.includes(".")) {
                filename = lastPart;
            }
        } catch (e) {
            // use default filename
        }

        // Get video blob
        const videoBlob = await videoResponse.blob();

        // Create response with proper headers for download
        const headers = new Headers();
        headers.set("Content-Type", "video/mp4");
        headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
        headers.set("Content-Length", videoBlob.size.toString());
        // Allow CORS if needed
        headers.set("Access-Control-Allow-Origin", "*");

        return new NextResponse(videoBlob, {
            status: 200,
            headers,
        });
    } catch (error: any) {
        console.error("Download proxy error:", error);
        return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
    }
}
