"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Upload } from "lucide-react";

interface Message {
    id: string;
    text?: string;
    image?: {
        src: string;
        fileName: string;
        size: number;
    };
    sender: "user" | "bot";
    timestamp: Date;
}

export function ChatContainer() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            text: input,
            sender: "user",
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: input }),
            });

            if (!response.ok) {
                throw new Error("Failed to get response from bot");
            }

            const data = await response.json();

            // Bot message from API response
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: data.message,
                sender: "bot",
                timestamp: new Date(data.timestamp),
            };

            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error("Error sending message:", error);
            // Hiển thị thông báo lỗi (tiếng Việt)
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: "Lỗi: Không nhận được phản hồi từ dịch vụ.",
                sender: "bot",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            alert("Vui lòng chọn một tệp ảnh hợp lệ");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert("Kích thước ảnh phải nhỏ hơn 5MB");
            return;
        }

        setIsLoading(true);

        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64String = event.target?.result as string;

                // Add user image message
                const userImageMessage: Message = {
                    id: Date.now().toString(),
                    image: {
                        src: base64String,
                        fileName: file.name,
                        size: file.size,
                    },
                    sender: "user",
                    timestamp: new Date(),
                };

                setMessages((prev) => [...prev, userImageMessage]);

                try {
                    const uploadResponse = await fetch("/api/chat", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            imageBase64: base64String,
                            fileName: file.name,
                        }),
                    });

                    if (!uploadResponse.ok) {
                        // Try to include server response body for better debugging
                        const text = await uploadResponse
                            .text()
                            .catch(() => "");
                        throw new Error(
                            `Failed to upload image: ${uploadResponse.status} ${text}`
                        );
                    }

                    const uploadData = await uploadResponse.json();

                    // Bot response with image info
                    const botMessage: Message = {
                        id: (Date.now() + 1).toString(),
                        text: `Đã nhận ảnh: ${uploadData.fileName} (${(
                            uploadData.size / 1024
                        ).toFixed(2)} KB)`,
                        sender: "bot",
                        timestamp: new Date(uploadData.timestamp),
                    };

                    setMessages((prev) => [...prev, botMessage]);
                } catch (error) {
                    console.error("Error uploading image:", error);
                    const errorMessage: Message = {
                        id: (Date.now() + 1).toString(),
                        text: "Lỗi: Không thể tải ảnh lên",
                        sender: "bot",
                        timestamp: new Date(),
                    };
                    setMessages((prev) => [...prev, errorMessage]);
                } finally {
                    setIsLoading(false);
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error("Error processing image:", error);
            setIsLoading(false);
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card p-4">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold text-foreground">
                        Chatbot tạo video
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Tạo video từ mô tả văn bản và ảnh
                    </p>
                </div>
            </header>

            {/* Messages Container */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full pt-20 text-center">
                            <div className="text-muted-foreground space-y-2">
                                <p className="text-lg font-medium">
                                    Chào mừng đến với Chatbot tạo video
                                </p>
                                <p className="text-sm">
                                    Nhập mô tả (prompt) để bắt đầu tạo video
                                </p>
                            </div>
                        </div>
                    )}

                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${
                                message.sender === "user"
                                    ? "justify-end"
                                    : "justify-start"
                            }`}
                        >
                            <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                    message.sender === "user"
                                        ? "bg-primary text-primary-foreground rounded-br-none"
                                        : "bg-card border border-border text-foreground rounded-bl-none"
                                }`}
                            >
                                {message.image && (
                                    <div className="mb-2">
                                        <img
                                            src={
                                                message.image.src ||
                                                "/placeholder.svg"
                                            }
                                            alt={message.image.fileName}
                                            className="rounded max-w-full h-auto"
                                        />
                                        <p className="text-xs mt-1 opacity-70">
                                            {message.image.fileName}
                                        </p>
                                    </div>
                                )}
                                {message.text && (
                                    <p className="break-words">
                                        {message.text}
                                    </p>
                                )}
                                <p className="text-xs mt-1 opacity-70">
                                    {message.timestamp.toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-card border border-border text-foreground px-4 py-2 rounded-lg rounded-bl-none">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100"></div>
                                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200"></div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </main>

            {/* Input Area */}
            <footer className="border-t border-border bg-card p-4">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                            type="text"
                            placeholder="Nhập mô tả (prompt) của bạn..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                            className="flex-1"
                        />
                        <Button
                            type="button"
                            disabled={isLoading}
                            size="icon"
                            className="bg-secondary hover:bg-secondary/90"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-4 h-4" />
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            size="icon"
                            className="bg-primary hover:bg-primary/90"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </footer>
        </div>
    );
}
