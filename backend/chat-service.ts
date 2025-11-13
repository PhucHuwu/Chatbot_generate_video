// Backend service for handling chat logic
export interface ChatRequest {
  message: string
}

export interface ChatResponse {
  message: string
  timestamp: string
}

export async function handleChatMessage(request: ChatRequest): Promise<ChatResponse> {
  return {
    message: request.message,
    timestamp: new Date().toISOString(),
  }
}
