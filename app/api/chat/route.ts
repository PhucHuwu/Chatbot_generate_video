import { handleChatMessage, type ChatRequest } from "@/backend/chat-service"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequest

    if (!body.message || !body.message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const response = await handleChatMessage(body)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
