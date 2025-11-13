import "@/lib/early-warnings"; // register warning handler early to suppress known upstream deprecation warnings
import { NextRequest, NextResponse } from "next/server";
import generateMedia, { createTask } from "@/backend/generate-service";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { describeImageWithGemini } from "@/backend/gemini-service";
import { sendToGroq } from "@/backend/groq-service";

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get("content-type") || "";

        // We accept JSON. If a client sends multipart/form-data, reject with helpful note.
        if (contentType.includes("multipart/form-data")) {
            return NextResponse.json(
                {
                    error: "multipart/form-data detected. Please send JSON with prompt and optional imageBase64 (data URL) or image_url.",
                },
                { status: 400 }
            );
        }

        const body = await request.json();

        // image_url can be provided directly, or client can send imageBase64 (data URL)
        let image_url: string | undefined =
            typeof body?.image_url === "string" && body.image_url.trim() !== ""
                ? body.image_url.trim()
                : undefined;

        // If imageBase64 present, upload to Cloudinary to get a public URL
        if (
            !image_url &&
            typeof body?.imageBase64 === "string" &&
            body.imageBase64.startsWith("data:image/")
        ) {
            try {
                image_url = await uploadImageToCloudinary(body.imageBase64);
                console.log("Image uploaded to Cloudinary:", image_url);
            } catch (e: any) {
                console.error("Failed to upload image to Cloudinary:", e);
                return NextResponse.json(
                    { error: `Không thể upload ảnh: ${e.message}` },
                    { status: 500 }
                );
            }
        }

        // Ensure image_url is an https public URL. KIE chỉ chấp nhận URL bắt đầu bằng https://
        if (image_url && !/^https:\/\//i.test(image_url)) {
            return NextResponse.json(
                {
                    error: "KIE chỉ chấp nhận URL HTTPS (bắt đầu bằng https://). Vui lòng gửi một image_url công khai bắt đầu bằng https:// hoặc gửi imageBase64 để upload.",
                },
                { status: 400 }
            );
        }

        // Now read prompt after handling image upload so we can support image-only requests
        let prompt = String(body?.prompt || "").trim();

        // Track whether the client provided an explicit prompt
        const clientProvidedPrompt = Boolean(
            body?.prompt && String(body.prompt).trim() !== ""
        );

        // If prompt is empty but an image was provided, obtain Gemini description and Groq output
        // then continue to call generateMedia so KIE can produce the final video. Prefer Groq output
        // as the prompt for KIE; fall back to Gemini description when Groq fails.
        if (!prompt && image_url) {
            console.log(
                "No prompt provided; calling gemini-service which uses its internal auto-prompt for image-only request."
            );

            let description: string | undefined;
            let groqOutput: string | undefined;

            try {
                description = await describeImageWithGemini(image_url);
                console.log("Gemini description:", description);
            } catch (e: any) {
                console.error("Gemini describe failed:", e);
                return NextResponse.json(
                    { error: `Gemini describe failed: ${e?.message || e}` },
                    { status: 500 }
                );
            }

            // Try Groq; if it fails, log and continue using the Gemini description as prompt
            try {
                groqOutput = await sendToGroq(description || "");
                console.log("Groq output:", groqOutput);
            } catch (gErr: any) {
                console.error("Groq processing failed:", gErr);
                groqOutput = undefined;
            }

            // Use Groq output when available, otherwise fall back to Gemini description
            prompt =
                typeof groqOutput === "string" && groqOutput.trim() !== ""
                    ? groqOutput
                    : description || "";

            // Create a KIE task immediately so the client can poll while seeing the AI 'thinking'
            const durationForCreate = body?.duration === "5" ? "5" : "10";
            const negativeForCreate =
                typeof body?.negative_prompt === "string"
                    ? body.negative_prompt
                    : undefined;
            const cfgForCreate =
                typeof body?.cfg_scale === "number"
                    ? body.cfg_scale
                    : undefined;

            const model = image_url
                ? "kling/v2-5-turbo-image-to-video-pro"
                : "kling/v2-5-turbo-text-to-video-pro";

            const createPayload: any = {
                prompt,
                duration: durationForCreate ?? "10",
                negative_prompt:
                    negativeForCreate ?? "blur, distort, and low quality",
                cfg_scale:
                    typeof cfgForCreate === "number" ? cfgForCreate : 0.3,
            };
            if (image_url) createPayload.image_url = image_url;

            // Attempt to create task, with fallback on 503/unavailable
            let createResp: any;
            try {
                createResp = await createTask(
                    model,
                    createPayload,
                    body?.callBackUrl
                );
            } catch (err: any) {
                const msg = String(err?.message || err);
                if (msg.includes("503") || /unavailab/i.test(msg)) {
                    console.warn(
                        "createTask failed with 503/unavailable — falling back to gemini-2.0-flash-lite",
                        { err: msg }
                    );
                    try {
                        createResp = await createTask(
                            "gemini-2.0-flash-lite",
                            createPayload,
                            body?.callBackUrl
                        );
                    } catch (err2: any) {
                        console.error(
                            "Both primary and fallback createTask failed:",
                            err2
                        );
                        return NextResponse.json(
                            { error: String(err2?.message || err2) },
                            { status: 500 }
                        );
                    }
                } else {
                    console.error("createTask failed:", err);
                    return NextResponse.json(
                        { error: String(err?.message || err) },
                        { status: 500 }
                    );
                }
            }

            const taskId =
                createResp?.data?.taskId ||
                createResp?.taskId ||
                createResp?.data?.id ||
                createResp?.id;
            if (!taskId) {
                console.error("createTask returned no taskId", { createResp });
                let summary = "";
                try {
                    summary = JSON.stringify(createResp);
                } catch (e) {
                    summary = String(createResp);
                }
                return NextResponse.json(
                    {
                        error: `No taskId returned from createTask; response: ${summary}`,
                    },
                    { status: 500 }
                );
            }

            // Return immediate response containing the Gemini/Groq outputs and the taskId for polling
            return NextResponse.json({
                description,
                groqOutput,
                image_url,
                taskId,
                state: "waiting",
            });
        }

        // If there's still no prompt (no prompt and no image), return error
        if (!prompt) {
            return NextResponse.json(
                { error: "Cần prompt để tạo media" },
                { status: 400 }
            );
        }

        // Optional parameters with simple validation
        // Accept only "5" or "10". Default to "10" when missing/invalid to change system default.
        const duration = body?.duration === "5" ? "5" : "10";
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
