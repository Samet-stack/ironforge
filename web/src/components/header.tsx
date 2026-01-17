"use client";

import { Badge } from "@/components/ui/badge";
import { Circle } from "lucide-react";

export function Header() {
    return (
        <header className="fixed left-64 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border/40 bg-background/80 px-8 backdrop-blur-xl">
            <div>
                <h1 className="text-xl font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
                <Badge
                    variant="outline"
                    className="gap-2 border-green-500/30 bg-green-500/10 text-green-400"
                >
                    <Circle className="h-2 w-2 fill-green-400" />
                    Redis Connected
                </Badge>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600" />
            </div>
        </header>
    );
}
