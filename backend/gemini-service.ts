import { GoogleGenAI, Part } from "@google/genai";

/**
 * Fetch an image from a public URL and convert to a Generative Part for Gemini.
 */
async function fetchImageAsPart(imageUrl: string): Promise<Part> {
    const res = await fetch(imageUrl);
    if (!res.ok)
        throw new Error(
            `Failed to fetch image: ${res.status} ${res.statusText}`
        );
    const contentType = (res.headers.get("content-type") || "image/jpeg").split(
        ";"
    )[0];
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return {
        inlineData: {
            data: base64,
            mimeType: contentType,
        },
    } as Part;
}

/**
 * Send image + prompt to Gemini (gemini-2.5-flash) and return the text description.
 * Requires GOOGLE_API_KEY or GEMINI_API_KEY in environment.
 * Implements retry logic with exponential backoff for 503/overload errors.
 */
export async function describeImageWithGemini(
    imageUrl: string,
    prompt: string,
    maxRetries = 3
) {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error(
            "Google/Gemini API key not configured. Set GOOGLE_API_KEY or GEMINI_API_KEY in env."
        );
    }

    const ai = new GoogleGenAI({ apiKey });

    const imagePart = await fetchImageAsPart(imageUrl);

    let lastError: any;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const resp: any = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [imagePart, prompt],
                config: {
                    temperature: 0.1,
                },
            });

            // Try a few common response shapes
            let text = "";
            if (typeof resp?.text === "string") text = resp.text;
            else if (Array.isArray(resp?.outputs) && resp.outputs[0]) {
                const out = resp.outputs[0];
                if (typeof out?.content === "string") text = out.content;
                else if (typeof out?.text === "string") text = out.text;
            }

            text = String(text || "").trim();
            return text;
        } catch (error: any) {
            lastError = error;

            // Parse error to check if it's a 503 overload
            const errorStr = JSON.stringify(error);
            const isOverloaded =
                errorStr.includes('"code":503') ||
                errorStr.includes("UNAVAILABLE") ||
                errorStr.includes("overloaded");

            // If this is the last attempt or not an overload error, don't retry
            if (attempt === maxRetries - 1 || !isOverloaded) {
                break;
            }

            // Exponential backoff: 1s, 2s, 4s
            const delayMs = Math.pow(2, attempt) * 1000;
            console.warn(
                `Gemini overloaded (attempt ${
                    attempt + 1
                }/${maxRetries}), retrying in ${delayMs}ms...`
            );
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }

    // If we get here, all retries failed
    throw lastError;
}

export default describeImageWithGemini;
