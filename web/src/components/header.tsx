"use client";

import { Badge } from "@/components/ui/badge";
import { LiveIndicator } from "@/components/live-indicator";
import {
    Search,
    Bell,
    Command,
    ChevronRight,
    User,
    Settings,
    LogOut,
} from "lucide-react";
import { useState } from "react";

export function Header() {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    return (
        <header className="fixed left-72 right-0 top-0 z-30 flex h-20 items-center justify-between border-b border-white/5 bg-background/60 px-8 backdrop-blur-xl">
            {/* Left side - IronForge title */}
            <div className="flex items-center gap-4">
                <span className="text-xl font-bold gradient-text">IronForge</span>
            </div>

            {/* Center - Search */}
            <div className="flex-1 max-w-xl mx-8">
                <div
                    className="relative group cursor-pointer"
                    onClick={() => alert('Search coming soon!')}
                >
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 transition-all hover:border-cyan-500/30 hover:bg-white/10">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Search jobs, workflows...</span>
                        <div className="ml-auto flex items-center gap-1">
                            <kbd className="flex h-5 items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 text-[10px] font-medium text-muted-foreground">
                                <Command className="h-3 w-3" />
                                K
                            </kbd>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-4">
                {/* Live status */}
                <LiveIndicator label="Live" color="green" />

                {/* Connection status */}
                <Badge
                    variant="outline"
                    className="gap-2 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 transition-all hover:bg-emerald-500/20"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                    Redis Connected
                </Badge>

                {/* Notifications */}
                <div className="relative">
                    <button
                        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all hover:border-cyan-500/30 hover:bg-white/10"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        {/* Notification dot */}
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                            3
                        </span>
                    </button>

                    {/* Notification dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 top-14 w-80 rounded-xl border border-white/10 bg-card/95 p-2 shadow-2xl backdrop-blur-xl animate-scale-in">
                            <div className="p-3 border-b border-white/5">
                                <h4 className="font-semibold">Notifications</h4>
                            </div>
                            {[
                                { title: "Job Failed", desc: "Payment sync failed after 3 retries", time: "2m ago", type: "error" },
                                { title: "New Worker", desc: "Worker node-5 joined the cluster", time: "15m ago", type: "info" },
                                { title: "Queue Alert", desc: "DLQ has 12 unprocessed jobs", time: "1h ago", type: "warning" },
                            ].map((notif, i) => (
                                <div key={i} className="flex gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                                    <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${notif.type === 'error' ? 'bg-rose-500' :
                                        notif.type === 'warning' ? 'bg-amber-500' : 'bg-cyan-500'
                                        }`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{notif.title}</p>
                                        <p className="text-xs text-muted-foreground truncate">{notif.desc}</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground flex-shrink-0">{notif.time}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* User avatar */}
                <div className="relative">
                    <button
                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition-all hover:border-cyan-500/30 hover:bg-white/10"
                        onClick={() => setShowProfile(!showProfile)}
                    >
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
                            <span className="text-sm font-semibold text-white">ST</span>
                        </div>
                        <div className="text-left hidden lg:block">
                            <p className="text-sm font-medium">Samet</p>
                            <p className="text-xs text-muted-foreground">Admin</p>
                        </div>
                    </button>

                    {/* Profile dropdown */}
                    {showProfile && (
                        <div className="absolute right-0 top-14 w-56 rounded-xl border border-white/10 bg-card/95 p-2 shadow-2xl backdrop-blur-xl animate-scale-in">
                            {[
                                { icon: User, label: "Profile" },
                                { icon: Settings, label: "Settings" },
                                { icon: LogOut, label: "Sign out" },
                            ].map((item, i) => (
                                <button
                                    key={i}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
