import { NextRequest, NextResponse } from "next/server";
import generateMedia from "@/backend/generate-service";

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get("content-type") || "";

        // Accept JSON body. For multipart/form-data uploads, ask user to provide
        // a public image URL (the external API requires an image_url). We keep
        // this simple: if client provides `image_url` in JSON, we'll call the
        // image-to-video model; otherwise we call text-to-video.
        if (contentType.includes("multipart/form-data")) {
            return NextResponse.json(
                {
                    error: "multipart/form-data detected. This endpoint currently requires a public image_url string (not a file). Please upload image to a public URL and send { image_url, prompt } or send JSON without image_url to use text-to-video.",
                },
                { status: 400 }
            );
        }

        const body = await request.json();
        const prompt = String(body?.prompt || "").trim();

        if (!prompt) {
            return NextResponse.json(
                { error: "Cần prompt để tạo media" },
                { status: 400 }
            );
        }

        const image_url =
            typeof body?.image_url === "string" && body.image_url.trim() !== ""
                ? body.image_url.trim()
                : undefined;

        // Optional parameters with simple validation
        const duration = body?.duration === "10" ? "10" : "5";
        const aspect_ratio = ["16:9", "9:16", "1:1"].includes(
            body?.aspect_ratio
        )
            ? body.aspect_ratio
            : "16:9";
        const negative_prompt =
            typeof body?.negative_prompt === "string"
                ? body.negative_prompt
                : undefined;
        const cfg_scale =
            typeof body?.cfg_scale === "number" ? body.cfg_scale : undefined;
        const callBackUrl =
            typeof body?.callBackUrl === "string"
                ? body.callBackUrl
                : undefined;

        const result = await generateMedia(
            {
                prompt,
                image_url,
                duration,
                aspect_ratio,
                negative_prompt,
                cfg_scale,
            },
            { callBackUrl }
        );

        return NextResponse.json(result);
    } catch (err: any) {
        console.error("/api/generate error", err);
        const message = err?.message || "Lỗi máy chủ";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
