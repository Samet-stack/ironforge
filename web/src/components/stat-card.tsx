"use client";

import { GlowCard } from "@/components/glow-card";
import { AnimatedCounter } from "@/components/animated-counter";
import { Layers, Loader2, CheckCircle2, XCircle, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
    title: string;
    value: number;
    subtitle?: string;
    icon: "queue" | "processing" | "completed" | "failed";
    trend?: { value: number; isPositive: boolean };
    delay?: number;
}

const iconMap = {
    queue: Layers,
    processing: Loader2,
    completed: CheckCircle2,
    failed: XCircle,
};

const colorMap = {
    queue: {
        gradient: "from-blue-500 to-cyan-500",
        glow: "cyan" as const,
        bg: "bg-blue-500/10",
        text: "text-blue-400",
    },
    processing: {
        gradient: "from-orange-500 to-amber-500",
        glow: "amber" as const,
        bg: "bg-orange-500/10",
        text: "text-orange-400",
    },
    completed: {
        gradient: "from-emerald-500 to-green-500",
        glow: "emerald" as const,
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
    },
    failed: {
        gradient: "from-rose-500 to-red-500",
        glow: "rose" as const,
        bg: "bg-rose-500/10",
        text: "text-rose-400",
    },
};

export function StatCard({ title, value, subtitle, icon, trend, delay = 0 }: StatCardProps) {
    const Icon = iconMap[icon];
    const colors = colorMap[icon];

    return (
        <div
            className="opacity-0 animate-fade-in-up"
            style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
        >
            <GlowCard glowColor={colors.glow} className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="mt-3 text-4xl font-bold tracking-tight">
                            <AnimatedCounter value={value} duration={1500 + delay} />
                        </p>
                        {subtitle && (
                            <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>
                        )}
                        {trend && (
                            <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                {trend.isPositive ? (
                                    <TrendingUp className="h-3 w-3" />
                                ) : (
                                    <TrendingDown className="h-3 w-3" />
                                )}
                                <span>{trend.isPositive ? '+' : ''}{trend.value}% from yesterday</span>
                            </div>
                        )}
                    </div>
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${colors.gradient} shadow-lg`}
                        style={{
                            boxShadow: `0 8px 24px ${colors.gradient.includes('blue') ? 'rgba(59, 130, 246, 0.3)' :
                                colors.gradient.includes('orange') ? 'rgba(249, 115, 22, 0.3)' :
                                    colors.gradient.includes('emerald') ? 'rgba(16, 185, 129, 0.3)' :
                                        'rgba(244, 63, 94, 0.3)'}`
                        }}
                    >
                        <Icon className={`h-7 w-7 text-white ${icon === 'processing' ? 'animate-spin' : ''}`} />
                    </div>
                </div>

                {/* Mini sparkline (decorative) */}
                <div className="mt-4 flex items-end gap-1 h-8">
                    {[40, 65, 45, 80, 55, 70, 90, 60, 85, 75, 95, 80].map((height, i) => (
                        <div
                            key={i}
                            className={`flex-1 rounded-sm bg-gradient-to-t ${colors.gradient} opacity-40 transition-all duration-300 hover:opacity-80`}
                            style={{ height: `${height}%` }}
                        />
                    ))}
                </div>
            </GlowCard>
        </div>
    );
}
