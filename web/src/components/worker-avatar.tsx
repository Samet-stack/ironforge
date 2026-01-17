"use client";

import { cn } from "@/lib/utils";

interface WorkerAvatarProps {
    name: string;
    size?: "sm" | "md" | "lg";
    className?: string;
    showStatus?: boolean;
    status?: "online" | "busy" | "offline";
}

const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
};

const statusClasses = {
    online: "bg-emerald-500",
    busy: "bg-amber-500",
    offline: "bg-slate-500",
};

// Generate a consistent color based on name
function getAvatarColor(name: string): string {
    const colors = [
        "from-violet-500 to-purple-600",
        "from-blue-500 to-cyan-600",
        "from-emerald-500 to-green-600",
        "from-orange-500 to-amber-600",
        "from-rose-500 to-pink-600",
        "from-indigo-500 to-blue-600",
        "from-teal-500 to-cyan-600",
        "from-fuchsia-500 to-purple-600",
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function WorkerAvatar({
    name,
    size = "md",
    className,
    showStatus = false,
    status = "online"
}: WorkerAvatarProps) {
    const gradient = getAvatarColor(name);
    const initials = getInitials(name);

    return (
        <div className={cn("relative inline-flex", className)}>
            <div
                className={cn(
                    "flex items-center justify-center rounded-xl font-semibold text-white bg-gradient-to-br shadow-lg",
                    gradient,
                    sizeClasses[size]
                )}
            >
                {initials}
            </div>
            {showStatus && (
                <span
                    className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                        statusClasses[status]
                    )}
                />
            )}
        </div>
    );
}
