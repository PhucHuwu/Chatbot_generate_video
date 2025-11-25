import React, { useState, useEffect } from "react";

export function AnimatedEllipsis({ interval = 400 }: { interval?: number }) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        const t = window.setInterval(() => {
            setCount((c) => (c + 1) % 4);
        }, interval);
        return () => clearInterval(t);
    }, [interval]);
    return (
        <span aria-hidden className="inline-block w-6">
            {".".repeat(count)}
        </span>
    );
}
