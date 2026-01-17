"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ListTodo,
    GitBranch,
    AlertTriangle,
    Settings,
    Zap,
    Users,
    BarChart3,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/jobs", label: "Jobs", icon: ListTodo },
    { href: "/workflows", label: "Workflows", icon: GitBranch },
    { href: "/workers", label: "Workers", icon: Users },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/dlq", label: "Dead Letter Queue", icon: AlertTriangle },
    { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-72 glass-sidebar">
            {/* Logo */}
            <div className="flex h-20 items-center gap-3 border-b border-white/5 px-6">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden">
                    {/* Animated gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 animate-gradient" />
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-purple-600 opacity-80" />
                    {/* Icon */}
                    <Zap className="relative h-6 w-6 text-white" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xl font-bold gradient-text">
                        IronForge
                    </span>
                    <span className="text-xs text-muted-foreground">
                        Enterprise Edition
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4">
                <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Main Menu
                </p>
                {navItems.map((item, index) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300",
                                "opacity-0 animate-fade-in-up",
                                isActive
                                    ? "text-white"
                                    : "text-muted-foreground hover:text-white"
                            )}
                            style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
                        >
                            {/* Active background */}
                            {isActive && (
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/20 to-purple-500/10 border border-violet-500/30" />
                            )}

                            {/* Hover background */}
                            <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 transition-opacity group-hover:opacity-100" />

                            {/* Icon with glow on active */}
                            <div className={cn(
                                "relative z-10 flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300",
                                isActive
                                    ? "bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30"
                                    : "bg-white/5 group-hover:bg-white/10"
                            )}>
                                <item.icon className={cn(
                                    "h-4 w-4 transition-colors",
                                    isActive ? "text-white" : "text-muted-foreground group-hover:text-white"
                                )} />
                            </div>

                            <span className="relative z-10">{item.label}</span>

                            {/* Arrow indicator for active */}
                            {isActive && (
                                <ChevronRight className="relative z-10 ml-auto h-4 w-4 text-violet-400" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom section - Usage stats */}
            <div className="border-t border-white/5 p-4">
                <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 p-4 border border-violet-500/20">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-muted-foreground">Monthly Usage</span>
                        <span className="text-xs font-semibold text-violet-400">78%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-1000"
                            style={{ width: '78%' }}
                        />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                        7.8M / 10M jobs processed
                    </p>
                </div>
            </div>
        </aside>
    );
}
