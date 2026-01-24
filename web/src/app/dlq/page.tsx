"use client";

import { useState } from "react";
import { AlertTriangle, RefreshCw, Trash2, Search, AlertCircle } from "lucide-react";
import { GlowCard } from "@/components/glow-card";

// Mock DLQ Data
const mockFailedJobs = [
    {
        id: "job_dead_1",
        kind: "payment.process",
        error: "ConnectionTimeout: Payment gateway did not respond after 30000ms",
        failedAt: "2023-10-25 14:30:22",
        retries: 5,
        payload: { amount: 450.00, currency: "USD", user_id: "u_8823" }
    },
    {
        id: "job_dead_2",
        kind: "email.send",
        error: "SMTPError: Invalid recipient address 'null'",
        failedAt: "2023-10-25 14:28:10",
        retries: 3,
        payload: { template: "welcome", user_id: "u_9912" }
    },
    {
        id: "job_dead_3",
        kind: "report.generate",
        error: "OutOfMemory: Java heap space",
        failedAt: "2023-10-25 13:15:00",
        retries: 3,
        payload: { report_type: "annual_summary", year: 2023 }
    }
];

export default function DLQPage() {
    const [jobs, setJobs] = useState(mockFailedJobs);
    const [searchQuery, setSearchQuery] = useState("");

    const handleRetry = (id: string) => {
        // Mock Retry API Call
        setJobs(jobs.filter(j => j.id !== id));
        // alert(`Job ${id} re-queued for processing`);
    };

    const handleDelete = (id: string) => {
        setJobs(jobs.filter(j => j.id !== id));
    };

    const handleRetryAll = () => {
        setJobs([]);
        // alert("All jobs re-queued");
    };

    const filteredJobs = jobs.filter(job =>
        job.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.kind.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.error.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <main className="min-h-screen bg-[#0A0A0B] text-white pl-72">
            <div className="p-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white glow-text-rose mb-2 flex items-center gap-3">
                            <AlertTriangle className="h-8 w-8 text-rose-500" />
                            Dead Letter Queue
                        </h1>
                        <p className="text-muted-foreground">
                            Manage failed jobs that have exceeded their retry limit.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleRetryAll}
                            disabled={jobs.length === 0}
                            className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-400 transition-all hover:bg-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Retry All
                        </button>
                        <button
                            onClick={() => setJobs([])}
                            disabled={jobs.length === 0}
                            className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-400 transition-all hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Trash2 className="h-4 w-4" />
                            Purge All
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by ID, kind or error..."
                            className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-rose-500/30 focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition-all"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="space-y-4">
                    {filteredJobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-white/5 bg-white/[0.02]">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 mb-4">
                                <AlertCircle className="h-8 w-8 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-semibold">No dead jobs found</h3>
                            <p className="text-muted-foreground mt-1">Your system is healthy!</p>
                        </div>
                    ) : (
                        filteredJobs.map((job) => (
                            <GlowCard key={job.id} glowColor="rose" className="p-0 overflow-visible group">
                                <div className="flex flex-col md:flex-row items-center p-6 gap-6">
                                    {/* Icon */}
                                    <div className="flex-shrink-0">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20">
                                            <AlertTriangle className="h-6 w-6 text-rose-500" />
                                        </div>
                                    </div>

                                    {/* Data */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-semibold text-white truncate">{job.kind}</h3>
                                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/20">
                                                FAILED
                                            </span>
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {job.id}
                                            </span>
                                        </div>
                                        <p className="text-sm text-rose-400 font-mono mb-2 truncate">
                                            {job.error}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span>Failed: {job.failedAt}</span>
                                            <span>Retries: {job.retries}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleRetry(job.id)}
                                            className="p-2 rounded-lg hover:bg-white/10 text-cyan-400 hover:text-cyan-300 transition-colors"
                                            title="Retry Job"
                                        >
                                            <RefreshCw className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(job.id)}
                                            className="p-2 rounded-lg hover:bg-white/10 text-rose-400 hover:text-rose-300 transition-colors"
                                            title="Delete Job"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Payload Preview (Collapsible/Optional) */}
                                <div className="px-6 pb-6 pt-0">
                                    <div className="bg-black/40 rounded-lg p-3 border border-white/5 font-mono text-xs text-muted-foreground overflow-x-auto">
                                        {JSON.stringify(job.payload, null, 2)}
                                    </div>
                                </div>
                            </GlowCard>
                        ))
                    )}
                </div>
            </div>
        </main>
    );
}
