"use client";

import { GlowCard } from "@/components/glow-card";
import { CheckCircle2, CircleDashed, Clock, XCircle, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export type WorkflowStatus = "pending" | "running" | "completed" | "failed";

interface WorkflowCardProps {
    id: string;
    name: string;
    status: WorkflowStatus;
    progress: number; // 0-100
    nodesTotal: number;
    nodesCompleted: number;
    createdAt: string;
}

const statusConfig = {
    pending: {
        icon: CircleDashed,
        color: "text-slate-400",
        bg: "bg-slate-500/10",
        border: "border-slate-500/20",
        glow: "violet" as const, // default
        label: "Pending",
    },
    running: {
        icon: Clock, // Or a spinner
        color: "text-cyan-400",
        bg: "bg-cyan-500/10",
        border: "border-cyan-500/20",
        glow: "cyan" as const,
        label: "Running",
    },
    completed: {
        icon: CheckCircle2,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        glow: "emerald" as const,
        label: "Completed",
    },
    failed: {
        icon: XCircle,
        color: "text-rose-400",
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
        glow: "rose" as const,
        label: "Failed",
    },
};

export function WorkflowCard({
    id,
    name,
    status,
    progress,
    nodesTotal,
    nodesCompleted,
    createdAt,
}: WorkflowCardProps) {
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <GlowCard glowColor={config.glow} className="group relative flex flex-col gap-4 p-5">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg border", config.bg, config.border)}>
                        <Icon className={cn("h-5 w-5", config.color, status === 'running' && "animate-spin-slow")} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                            {name}
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            ID: {id.substring(0, 8)}...
                        </p>
                    </div>
                </div>
                <div className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", config.bg, config.border, config.color)}>
                    {config.label}
                </div>
            </div>

            {/* Progress Section */}
            <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                        className={cn("h-full rounded-full transition-all duration-500",
                            status === 'failed' ? "bg-rose-500" :
                                status === 'completed' ? "bg-emerald-500" :
                                    "bg-gradient-to-r from-cyan-400 to-teal-500"
                        )}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Footer Stats */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-auto">
                <div className="flex gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Play className="h-3 w-3" />
                        <span>{nodesCompleted}/{nodesTotal} jobs</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        <span>{createdAt}</span>
                    </div>
                </div>

                <Link
                    href={`/workflows/${id}`}
                    className="flex items-center gap-1 text-xs font-medium text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300"
                >
                    View Details
                    <ChevronRight className="h-3 w-3" />
                </Link>
            </div>
        </GlowCard>
    );
}
