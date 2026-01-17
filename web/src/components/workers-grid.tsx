"use client";

import { GlowCard } from "@/components/glow-card";
import { WorkerAvatar } from "@/components/worker-avatar";
import {
    Briefcase,
    Clock,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    MoreVertical,
} from "lucide-react";
import Link from "next/link";

export interface Worker {
    id: string;
    name: string;
    role: string;
    status: "online" | "busy" | "offline";
    assignedJobs: number;
    completedToday: number;
    avgTime: string;
    successRate: number;
}

interface WorkersGridProps {
    workers: Worker[];
    onAssignJob?: (workerId: string) => void;
}

export function WorkersGrid({ workers, onAssignJob }: WorkersGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {workers.map((worker, index) => (
                <div
                    key={worker.id}
                    className="opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
                >
                    <GlowCard
                        glowColor={worker.status === "online" ? "emerald" : worker.status === "busy" ? "amber" : "violet"}
                        className="p-6 group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <WorkerAvatar
                                    name={worker.name}
                                    size="lg"
                                    showStatus
                                    status={worker.status}
                                />
                                <div>
                                    <h3 className="font-semibold text-foreground">{worker.name}</h3>
                                    <p className="text-sm text-muted-foreground">{worker.role}</p>
                                </div>
                            </div>
                            <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all">
                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2.5">
                                <Briefcase className="h-4 w-4 text-violet-400" />
                                <div>
                                    <p className="text-lg font-bold">{worker.assignedJobs}</p>
                                    <p className="text-xs text-muted-foreground">Assigned</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2.5">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                <div>
                                    <p className="text-lg font-bold">{worker.completedToday}</p>
                                    <p className="text-xs text-muted-foreground">Today</p>
                                </div>
                            </div>
                        </div>

                        {/* Success rate bar */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-muted-foreground">Success Rate</span>
                                <span className="text-xs font-semibold text-emerald-400">{worker.successRate}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500"
                                    style={{ width: `${worker.successRate}%` }}
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>Avg: {worker.avgTime}</span>
                            </div>
                            <Link
                                href={`/workers/${worker.id}`}
                                className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
                            >
                                View Details →
                            </Link>
                        </div>
                    </GlowCard>
                </div>
            ))}
        </div>
    );
}
