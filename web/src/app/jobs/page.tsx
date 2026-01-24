"use client";

import { useState } from "react";
import { ListTodo, Search, Filter, Play, Clock, User } from "lucide-react";
import { GlowCard } from "@/components/glow-card";
import { AssignJobModal } from "@/components/assign-job-modal";
import { WorkerAvatar } from "@/components/worker-avatar";

// Mock Jobs Data
const mockJobs = [
    {
        id: "job_99821",
        kind: "payment.process",
        status: "queued",
        priority: "critical",
        created_at: "2 mins ago",
        assigned_to: null,
        payload: { amount: 1500, currency: "USD" }
    },
    {
        id: "job_99822",
        kind: "email.send_batch",
        status: "running",
        priority: "high",
        created_at: "5 mins ago",
        assigned_to: "Alice Martin",
        progress: 45,
        payload: { template: "newsletter_jan", recipients: 5000 }
    },
    {
        id: "job_99823",
        kind: "image.resize",
        status: "queued",
        priority: "low",
        created_at: "10 mins ago",
        assigned_to: null,
        payload: { width: 1024, height: 768 }
    },
    {
        id: "job_99824",
        kind: "report.generate",
        status: "completed",
        priority: "medium",
        created_at: "1 hour ago",
        assigned_to: "Bob Johnson",
        progress: 100,
        payload: { type: "monthly_revenue" }
    }
];

export default function JobsPage() {
    const [jobs, setJobs] = useState(mockJobs);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedJob, setSelectedJob] = useState<{ id: string, kind: string } | null>(null);

    const handleAssign = (workerId: string, workerName: string) => {
        if (!selectedJob) return;

        setJobs(jobs.map(j =>
            j.id === selectedJob.id
                ? { ...j, status: "running", assigned_to: workerName, progress: 0 }
                : j
        ));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "running": return "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
            case "completed": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
            case "failed": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
            case "queued": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
            default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "critical": return "text-rose-500";
            case "high": return "text-orange-500";
            case "medium": return "text-cyan-500";
            case "low": return "text-slate-500";
            default: return "text-slate-500";
        }
    };

    return (
        <main className="min-h-screen bg-[#0A0A0B] text-white pl-72">
            <div className="p-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white glow-text-cyan flex items-center gap-3 mb-2">
                            <ListTodo className="h-8 w-8 text-cyan-400" />
                            Jobs
                        </h1>
                        <p className="text-muted-foreground">
                            Monitor and manage individual job processing.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-semibold transition-all hover:bg-white/10">
                            <Filter className="h-4 w-4" />
                            Filter
                        </button>
                        <button className="flex items-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 px-4 py-2.5 text-sm font-semibold text-cyan-400 transition-all hover:bg-cyan-500/20">
                            <Play className="h-4 w-4" />
                            Auto-Assign
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search jobs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all"
                        />
                    </div>
                </div>

                {/* Jobs List */}
                <div className="space-y-4">
                    {jobs.map((job) => (
                        <GlowCard key={job.id} glowColor="cyan" className="p-0 overflow-visible group" hover={false}>
                            <div className="flex flex-col md:flex-row items-center p-4 gap-4 md:gap-6">
                                {/* Priority Indicator */}
                                <div className={`w-1 h-12 rounded-full ${getPriorityColor(job.priority).replace('text-', 'bg-')}`} />

                                {/* Main Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-semibold text-white truncate">{job.kind}</h3>
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${getStatusColor(job.status)}`}>
                                            {job.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                                        <span>ID: {job.id}</span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {job.created_at}
                                        </span>
                                    </div>
                                </div>

                                {/* Assignment / Worker */}
                                <div className="flex-shrink-0 w-48">
                                    {job.assigned_to ? (
                                        <div className="flex items-center gap-2">
                                            <WorkerAvatar name={job.assigned_to} size="xs" />
                                            <div className="text-sm">
                                                <p className="text-xs text-muted-foreground">Assigned to</p>
                                                <p className="font-medium text-cyan-50">{job.assigned_to}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-muted-foreground opacity-50">
                                            <div className="h-8 w-8 rounded-full border border-dashed border-white/20 flex items-center justify-center">
                                                <User className="h-4 w-4" />
                                            </div>
                                            <span className="text-xs italic">Unassigned</span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex-shrink-0">
                                    {job.status === 'queued' && !job.assigned_to && (
                                        <button
                                            onClick={() => setSelectedJob({ id: job.id, kind: job.kind })}
                                            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold hover:bg-cyan-500/20 transition-all"
                                        >
                                            Assign
                                        </button>
                                    )}
                                    {job.status === 'running' && (
                                        <div className="w-24">
                                            <div className="flex justify-between text-[10px] mb-1 text-cyan-400">
                                                <span>Progress</span>
                                                <span>{job.progress}%</span>
                                            </div>
                                            <div className="h-1.5 bg-cyan-900/30 rounded-full overflow-hidden">
                                                <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${job.progress}%` }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </GlowCard>
                    ))}
                </div>
            </div>

            <AssignJobModal
                isOpen={!!selectedJob}
                onClose={() => setSelectedJob(null)}
                jobId={selectedJob?.id || ""}
                jobKind={selectedJob?.kind || ""}
                onAssign={handleAssign}
            />
        </main>
    );
}
