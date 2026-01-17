"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ListTodo,
    GitBranch,
    AlertTriangle,
    Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/jobs", label: "Jobs", icon: ListTodo },
    { href: "/workflows", label: "Workflows", icon: GitBranch },
    { href: "/dlq", label: "Dead Letter Queue", icon: AlertTriangle },
    { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border/40 bg-card/50 backdrop-blur-xl">
            {/* Logo */}
            <div className="flex h-16 items-center gap-3 border-b border-border/40 px-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                    <span className="text-xl font-bold text-white">F</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                    IronForge
                </span>
            </div>

            {/* Navigation */}
            <nav className="space-y-1 p-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all",
                                isActive
                                    ? "bg-violet-500/20 text-violet-400"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
