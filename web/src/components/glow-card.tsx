"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlowCardProps {
    children: ReactNode;
    className?: string;
    glowColor?: "violet" | "cyan" | "emerald" | "amber" | "rose";
    hover?: boolean;
}

const glowColors = {
    violet: "rgba(139, 92, 246, 0.4)",
    cyan: "rgba(6, 182, 212, 0.4)",
    emerald: "rgba(16, 185, 129, 0.4)",
    amber: "rgba(245, 158, 11, 0.4)",
    rose: "rgba(244, 63, 94, 0.4)",
};

const borderColors = {
    violet: "rgba(139, 92, 246, 0.3)",
    cyan: "rgba(6, 182, 212, 0.3)",
    emerald: "rgba(16, 185, 129, 0.3)",
    amber: "rgba(245, 158, 11, 0.3)",
    rose: "rgba(244, 63, 94, 0.3)",
};

export function GlowCard({
    children,
    className,
    glowColor = "cyan",
    hover = true
}: GlowCardProps) {
    return (
        <div
            className={cn(
                "relative rounded-xl overflow-hidden transition-all duration-300",
                hover && "hover:-translate-y-1",
                className
            )}
            style={{
                background: `linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)`,
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: `1px solid rgba(255, 255, 255, 0.08)`,
                boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
            }}
            onMouseEnter={(e) => {
                if (hover) {
                    e.currentTarget.style.borderColor = borderColors[glowColor];
                    e.currentTarget.style.boxShadow = `
                        0 8px 32px rgba(0, 0, 0, 0.4),
                        0 0 40px ${glowColors[glowColor]},
                        inset 0 1px 0 rgba(255, 255, 255, 0.1)
                    `;
                }
            }}
            onMouseLeave={(e) => {
                if (hover) {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.boxShadow = `
                        0 8px 32px rgba(0, 0, 0, 0.3),
                        inset 0 1px 0 rgba(255, 255, 255, 0.05)
                    `;
                }
            }}
        >
            {children}
        </div>
    );
}
