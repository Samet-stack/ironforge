"use client";

import { cn } from "@/lib/utils";

interface LiveIndicatorProps {
    className?: string;
    label?: string;
    color?: "green" | "violet" | "cyan" | "amber";
}

const colorClasses = {
    green: {
        dot: "bg-green-400",
        ring: "bg-green-400/40",
        text: "text-green-400",
    },
    violet: {
        dot: "bg-violet-400",
        ring: "bg-violet-400/40",
        text: "text-violet-400",
    },
    cyan: {
        dot: "bg-cyan-400",
        ring: "bg-cyan-400/40",
        text: "text-cyan-400",
    },
    amber: {
        dot: "bg-amber-400",
        ring: "bg-amber-400/40",
        text: "text-amber-400",
    },
};

export function LiveIndicator({
    className,
    label = "Live",
    color = "green"
}: LiveIndicatorProps) {
    const colors = colorClasses[color];

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="relative flex h-3 w-3">
                <span
                    className={cn(
                        "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                        colors.ring
                    )}
                />
                <span
                    className={cn(
                        "relative inline-flex rounded-full h-3 w-3",
                        colors.dot
                    )}
                />
            </div>
            <span className={cn("text-xs font-medium uppercase tracking-wider", colors.text)}>
                {label}
            </span>
        </div>
    );
}
