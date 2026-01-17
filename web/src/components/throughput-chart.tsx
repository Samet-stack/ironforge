"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data for the chart
const data = [
    { time: "00:00", value: 120 },
    { time: "04:00", value: 80 },
    { time: "08:00", value: 200 },
    { time: "12:00", value: 320 },
    { time: "14:30", value: 320 },
    { time: "16:00", value: 280 },
    { time: "20:00", value: 180 },
];

export function ThroughputChart() {
    return (
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                    Job Throughput (jobs/min)
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                    {new Date().toLocaleTimeString()} • {new Date().toLocaleDateString()}
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(255,255,255,0.1)"
                            />
                            <XAxis
                                dataKey="time"
                                stroke="rgba(255,255,255,0.4)"
                                tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.4)"
                                tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                                    border: "1px solid rgba(139, 92, 246, 0.3)",
                                    borderRadius: "8px",
                                }}
                                labelStyle={{ color: "#fff" }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
