import { WorkersGrid, Worker } from "@/components/workers-grid";
import { GlowCard } from "@/components/glow-card";
import { Users, UserCheck, UserX, Activity, UserPlus } from "lucide-react";

// Workers list - ready to receive jobs (no jobs assigned yet)
const workers: Worker[] = [
    {
        id: "worker-1",
        name: "Alice Martin",
        role: "Senior Developer",
        status: "online",
        assignedJobs: 0,
        completedToday: 0,
        avgTime: "-",
        successRate: 100,
    },
    {
        id: "worker-2",
        name: "Bob Johnson",
        role: "Backend Engineer",
        status: "online",
        assignedJobs: 0,
        completedToday: 0,
        avgTime: "-",
        successRate: 100,
    },
    {
        id: "worker-3",
        name: "Claire Dubois",
        role: "DevOps Engineer",
        status: "online",
        assignedJobs: 0,
        completedToday: 0,
        avgTime: "-",
        successRate: 100,
    },
    {
        id: "worker-4",
        name: "David Chen",
        role: "Full Stack Developer",
        status: "online",
        assignedJobs: 0,
        completedToday: 0,
        avgTime: "-",
        successRate: 100,
    },
    {
        id: "worker-5",
        name: "Emma Wilson",
        role: "Data Engineer",
        status: "online",
        assignedJobs: 0,
        completedToday: 0,
        avgTime: "-",
        successRate: 100,
    },
    {
        id: "worker-6",
        name: "Frank Miller",
        role: "Junior Developer",
        status: "online",
        assignedJobs: 0,
        completedToday: 0,
        avgTime: "-",
        successRate: 100,
    },
];

export default function WorkersPage() {
    const onlineCount = workers.filter(w => w.status === "online").length;
    const busyCount = workers.filter(w => w.status === "busy").length;
    const offlineCount = workers.filter(w => w.status === "offline").length;
    const totalAssigned = workers.reduce((sum, w) => sum + w.assignedJobs, 0);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="opacity-0 animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Team <span className="gradient-text">Workers</span>
                        </h1>
                        <p className="mt-2 text-muted-foreground">
                            Manage your team and track job assignments
                        </p>
                    </div>
                    <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:-translate-y-0.5">
                        <UserPlus className="h-4 w-4" />
                        Add Worker
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 opacity-0 animate-fade-in-up stagger-1" style={{ animationFillMode: 'forwards' }}>
                <GlowCard glowColor="violet" className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20">
                            <Users className="h-5 w-5 text-violet-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{workers.length}</p>
                            <p className="text-xs text-muted-foreground">Total Workers</p>
                        </div>
                    </div>
                </GlowCard>
                <GlowCard glowColor="emerald" className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                            <UserCheck className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{onlineCount}</p>
                            <p className="text-xs text-muted-foreground">Online & Ready</p>
                        </div>
                    </div>
                </GlowCard>
                <GlowCard glowColor="amber" className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                            <Activity className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{busyCount}</p>
                            <p className="text-xs text-muted-foreground">Busy</p>
                        </div>
                    </div>
                </GlowCard>
                <GlowCard glowColor="cyan" className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
                            <Activity className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{totalAssigned}</p>
                            <p className="text-xs text-muted-foreground">Jobs Assigned</p>
                        </div>
                    </div>
                </GlowCard>
            </div>

            {/* Workers Grid */}
            <div>
                <h2 className="text-lg font-semibold mb-4">All Workers</h2>
                <WorkersGrid workers={workers} />
            </div>
        </div>
    );
}
