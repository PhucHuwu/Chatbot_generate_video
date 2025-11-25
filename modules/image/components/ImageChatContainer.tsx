"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Trash, Video } from "lucide-react";
import { useTheme } from "@/components/theme-toggle-provider";
import NativeConfirm from "@/components/ui/native-confirm";
import { Message } from "@/modules/video/types";
import { MessageList } from "@/modules/video/components/MessageList";
import { InputArea } from "@/modules/video/components/InputArea";

export function ImageChatContainer() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [hasLoadedHistory, setHasLoadedHistory] = useState(false);

    const STORAGE_KEY = "chat_history_image_v1";

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    const restored: Message[] = parsed.map((m) => ({
                        ...m,
                        timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
                    }));
                    setMessages(restored);
                }
            }
        } catch (e) {}
        setHasLoadedHistory(true);
    }, []);

    useEffect(() => {
        if (!hasLoadedHistory) return;
        try {
            const toSave = messages.map((m) => ({
                ...m,
                timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
            }));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        } catch (e) {}
    }, [messages, hasLoadedHistory]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const toggleThinking = (id: string) => {
        // No thinking state for image chat yet, but required by MessageList
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: input,
            sender: "user",
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        // Mock response
        setTimeout(() => {
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: userMessage.text, // Echo
                sender: "bot",
                timestamp: new Date(),
                // Simulate image result for testing if needed, or just text echo
                // media: { type: "image", src: "..." }
            };
            setMessages((prev) => [...prev, botMessage]);
            setIsLoading(false);
        }, 1000);
    };

    const clearHistory = () => {
        setIsConfirmOpen(true);
    };

    const doClearHistory = () => {
        setMessages([]);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {}
        setIsConfirmOpen(false);
    };

    return (
        <div className="flex flex-col h-screen bg-background">
            <header className="border-b border-border bg-card p-4">
                <div className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground hidden md:block">Chatbot tạo ảnh</h1>
                            <p className="text-sm text-muted-foreground hidden md:block">Tạo ảnh từ mô tả văn bản</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => router.push("/")} className="gap-2">
                            <Video className="h-4 w-4" />
                            <span className="hidden sm:inline">Chế độ Video</span>
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={toggleTheme}
                            title={theme === "light" ? "Chuyển sang chế độ tối" : "Chuyển sang chế độ sáng"}
                        >
                            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={clearHistory} disabled={messages.length === 0 || isLoading} title="Xóa lịch sử chat">
                            <Trash className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto h-full flex flex-col">
                    <MessageList messages={messages} onToggleThinking={toggleThinking} messagesEndRef={messagesEndRef} />
                </div>
            </div>

            <InputArea input={input} setInput={setInput} onSend={handleSendMessage} isLoading={isLoading} textareaRef={textareaRef} />

            <NativeConfirm
                open={isConfirmOpen}
                title="Xóa lịch sử chat"
                description="Bạn có chắc muốn xóa toàn bộ lịch sử chat? Hành động này không thể hoàn tác."
                confirmLabel="Xóa"
                cancelLabel="Hủy"
                onConfirm={doClearHistory}
                onCancel={() => setIsConfirmOpen(false)}
            />
        </div>
    );
}
