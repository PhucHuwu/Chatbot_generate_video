import React from "react";
import { cn } from "@/lib/utils";

export function AnimatedEllipsis({ className }: { className?: string }) {
    return (
        <span className={cn("inline-flex gap-1 ml-1", className)} aria-label="Loading">
            <span className="animate-bounce [animation-delay:0ms] opacity-60">.</span>
            <span className="animate-bounce [animation-delay:150ms] opacity-60">.</span>
            <span className="animate-bounce [animation-delay:300ms] opacity-60">.</span>
        </span>
    );
}
