import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Settings } from "@/modules/video/types";

interface SettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    settings: Settings;
    onSave: (newSettings: Settings) => void;
}

export function SettingsDialog({ isOpen, onClose, settings: initialSettings, onSave }: SettingsDialogProps) {
    const [localSettings, setLocalSettings] = useState<Settings>(initialSettings);

    useEffect(() => {
        setLocalSettings(initialSettings);
    }, [initialSettings, isOpen]);

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <h2 className="mb-4 text-xl font-bold">Cài đặt API Key</h2>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Google Gemini API Key (Optional)</Label>
                        <Input
                            type="password"
                            placeholder="Mặc định sử dụng key của hệ thống"
                            value={localSettings.googleApiKey || ""}
                            onChange={(e) => setLocalSettings({ ...localSettings, googleApiKey: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Dùng để sinh mô tả ảnh (image-to-text).</p>
                    </div>
                    <div className="space-y-2">
                        <Label>OpenRouter API Key (Optional)</Label>
                        <Input
                            type="password"
                            placeholder="Mặc định sử dụng key của hệ thống"
                            value={localSettings.openrouterApiKey || ""}
                            onChange={(e) => setLocalSettings({ ...localSettings, openrouterApiKey: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Dùng làm fallback nếu Gemini lỗi.</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Groq API Key (Optional)</Label>
                        <Input
                            type="password"
                            placeholder="Mặc định sử dụng key của hệ thống"
                            value={localSettings.groqApiKey || ""}
                            onChange={(e) => setLocalSettings({ ...localSettings, groqApiKey: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Dùng để tạo prompt chi tiết cho video.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Thời lượng video</Label>
                        <RadioGroup
                            value={localSettings.duration || "10"}
                            onValueChange={(val) => setLocalSettings({ ...localSettings, duration: val as "5" | "10" })}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="5" id="d5" />
                                <Label htmlFor="d5">5 giây</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="10" id="d10" />
                                <Label htmlFor="d10">10 giây</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Đóng
                    </Button>
                    <Button onClick={handleSave}>Lưu cài đặt</Button>
                </div>
            </div>
        </div>
    );
}
