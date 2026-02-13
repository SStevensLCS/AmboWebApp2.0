"use client";

import React, { useEffect, useState } from "react";

interface CheddarRainProps {
    isActive: boolean;
    onComplete?: () => void;
}

interface Piece {
    id: number;
    left: number; // 0-100%
    delay: number; // seconds
    duration: number; // seconds
    size: number; // px
}

export function CheddarRain({ isActive, onComplete }: CheddarRainProps) {
    const [pieces, setPieces] = useState<Piece[]>([]);

    useEffect(() => {
        if (isActive) {
            // Generate pieces
            const newPieces: Piece[] = Array.from({ length: 50 }).map((_, i) => ({
                id: i,
                left: Math.random() * 100,
                delay: Math.random() * 5, // Random delay start
                duration: 3 + Math.random() * 2, // Fall speed between 3s and 5s
                size: 20 + Math.random() * 30, // Random size
            }));
            setPieces(newPieces);

            // Stop after 10 seconds (requested update)
            const timer = setTimeout(() => {
                setPieces([]); // Clear pieces
                if (onComplete) onComplete();
            }, 10000);

            return () => clearTimeout(timer);
        } else {
            setPieces([]);
        }
    }, [isActive, onComplete]);

    if (!isActive || pieces.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {pieces.map((p) => (
                <span
                    key={p.id}
                    className="absolute top-[-50px] select-none"
                    style={{
                        left: `${p.left}%`,
                        fontSize: `${p.size}px`,
                        animation: `fall ${p.duration}s linear ${p.delay}s infinite both`,
                    }}
                >
                    🧀
                </span>
            ))}
        </div>
    );
}
