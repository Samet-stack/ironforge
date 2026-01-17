"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Layers, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: "queue" | "processing" | "completed" | "failed";
    trend?: string;
}

const iconMap = {
    queue: Layers,
    processing: Loader2,
    completed: CheckCircle2,
    failed: XCircle,
};

const colorMap = {
    queue: "from-blue-500 to-cyan-500",
    processing: "from-orange-500 to-amber-500",
    completed: "from-green-500 to-emerald-500",
    failed: "from-red-500 to-rose-500",
};

export function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
    const Icon = iconMap[icon];
    const gradient = colorMap[icon];

    return (
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p className="mt-2 text-3xl font-bold">{value}</p>
                        {subtitle && (
                            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
                        )}
                        {trend && (
                            <p className="mt-1 text-xs text-green-500">{trend}</p>
                        )}
                    </div>
                    <div className={`rounded-lg bg-gradient-to-br ${gradient} p-3`}>
                        <Icon className="h-5 w-5 text-white" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
