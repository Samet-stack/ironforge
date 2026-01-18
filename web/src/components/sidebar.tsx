"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ListTodo,
    GitBranch,
    AlertTriangle,
    Settings,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Custom IronForge T-shaped logo component matching reference design
function IronForgeLogo() {
    return (
        <div className="relative flex h-16 w-16 items-center justify-center">
            {/* Outer glow effect */}
            <div className="absolute inset-0 rounded-lg bg-cyan-400/20 blur-xl" />

            {/* T-shaped logo */}
            <svg
                viewBox="0 0 64 64"
                className="relative h-14 w-14"
                fill="none"
            >
                {/* Main T structure */}
                <path
                    d="M12 8 H52 V18 H37 V56 H27 V18 H12 V8 Z"
                    fill="url(#cyanGradient)"
                    stroke="url(#cyanStroke)"
                    strokeWidth="1"
                />

                {/* Decorative corner accents */}
                <path
                    d="M8 4 L16 4 L16 8 L12 8 L12 12 L8 12 Z"
                    fill="#22d3ee"
                    opacity="0.6"
                />
                <path
                    d="M48 4 L56 4 L56 12 L52 12 L52 8 L48 8 Z"
                    fill="#22d3ee"
                    opacity="0.6"
                />

                {/* Bottom extension accent */}
                <path
                    d="M23 52 L27 52 L27 60 L23 60 Z"
                    fill="#22d3ee"
                    opacity="0.4"
                />
                <path
                    d="M37 52 L41 52 L41 60 L37 60 Z"
                    fill="#22d3ee"
                    opacity="0.4"
                />

                {/* Gradients */}
                <defs>
                    <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="50%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#0891b2" />
                    </linearGradient>
                    <linearGradient id="cyanStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#67e8f9" />
                        <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}

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
        <aside className="fixed left-0 top-0 z-40 h-screen w-72 glass-sidebar">
            {/* Logo Section */}
            <div className="flex h-28 items-center justify-center border-b border-white/5 px-6">
                <div className="flex flex-col items-center">
                    <IronForgeLogo />
                    <span className="mt-1 text-lg font-semibold gradient-text">
                        IronForge
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4">
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
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-teal-500/10 border border-cyan-500/30" />
                            )}

                            {/* Hover background */}
                            <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 transition-opacity group-hover:opacity-100" />

                            {/* Icon with glow on active */}
                            <div className={cn(
                                "relative z-10 flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300",
                                isActive
                                    ? "bg-gradient-to-br from-cyan-400 to-teal-500 shadow-lg shadow-cyan-500/30"
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
                                <ChevronRight className="relative z-10 ml-auto h-4 w-4 text-cyan-400" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom section - Usage stats */}
            <div className="border-t border-white/5 p-4">
                <div className="rounded-xl bg-gradient-to-br from-cyan-500/10 to-teal-500/5 p-4 border border-cyan-500/20">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-muted-foreground">Monthly Usage</span>
                        <span className="text-xs font-semibold text-cyan-400">78%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-teal-500 transition-all duration-1000"
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
