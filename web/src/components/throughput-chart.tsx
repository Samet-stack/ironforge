"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { GlowCard } from "@/components/glow-card";
import { LiveIndicator } from "@/components/live-indicator";
import { TrendingUp, Inbox } from "lucide-react";

// Empty data - will be populated when jobs are processed
const data: { time: string; completed: number; failed: number; queued: number }[] = [];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-xl border border-white/10 bg-card/95 p-4 shadow-2xl backdrop-blur-xl">
                <p className="mb-2 text-sm font-semibold text-foreground">{label}</p>
                {payload.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-muted-foreground capitalize">{item.dataKey}:</span>
                        <span className="font-medium text-foreground">{item.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function ThroughputChart() {
    const totalToday = data.reduce((sum, d) => sum + d.completed, 0);

    return (
        <div className="opacity-0 animate-fade-in-up stagger-4" style={{ animationFillMode: 'forwards' }}>
            <GlowCard className="overflow-hidden">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 pb-2">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">Job Throughput</h3>
                            <LiveIndicator label="Real-time" color="violet" />
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Jobs processed per hour over the last 24 hours
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-2xl font-bold">{totalToday}</p>
                            <p className="text-xs text-muted-foreground">Total today</p>
                        </div>
                        <div className="h-10 w-px bg-white/10" />
                        <div className="text-right">
                            <div className="flex items-center gap-1 text-muted-foreground">
                                <TrendingUp className="h-4 w-4" />
                                <span className="text-lg font-bold">-</span>
                            </div>
                            <p className="text-xs text-muted-foreground">vs yesterday</p>
                        </div>
                    </div>
                </div>

                {/* Chart or Empty State */}
                <div className="h-[350px] w-full px-4 pb-4">
                    {data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 mb-4">
                                <Inbox className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h4 className="text-lg font-semibold mb-2">No data yet</h4>
                            <p className="text-sm text-muted-foreground text-center max-w-sm">
                                Start processing jobs to see throughput metrics here.
                            </p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorQueued" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="rgba(255,255,255,0.05)"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="time"
                                    stroke="rgba(255,255,255,0.2)"
                                    tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="rgba(255,255,255,0.2)"
                                    tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    wrapperStyle={{ paddingTop: 20 }}
                                    formatter={(value) => (
                                        <span className="text-sm text-muted-foreground capitalize">{value}</span>
                                    )}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="queued"
                                    stroke="#06b6d4"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorQueued)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="completed"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorCompleted)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="failed"
                                    stroke="#f43f5e"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorFailed)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </GlowCard>
        </div>
    );
}
