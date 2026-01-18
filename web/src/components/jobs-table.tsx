"use client";

import { GlowCard } from "@/components/glow-card";
import { WorkerAvatar } from "@/components/worker-avatar";
import { AssignJobModal } from "@/components/assign-job-modal";
import { CreateJobModal } from "@/components/create-job-modal";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Search,
    MoreVertical,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Play,
    Pause,
    RotateCcw,
    UserPlus,
    Inbox,
    Plus,
} from "lucide-react";
import { useState, useEffect } from "react";

// Job type
export interface Job {
    id: string;
    kind: string;
    status: string;
    priority: string;
    created: string;
    duration: string;
    worker: string;
    description?: string;
    assignee?: {
        id: string;
        name: string;
    };
}

// Export jobs state for other components
export const useJobs = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    return { jobs, setJobs };
};

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
    completed: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
    processing: { bg: "bg-violet-500/10", text: "text-violet-400", dot: "bg-violet-400" },
    queued: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
    failed: { bg: "bg-rose-500/10", text: "text-rose-400", dot: "bg-rose-400" },
    retrying: { bg: "bg-cyan-500/10", text: "text-cyan-400", dot: "bg-cyan-400" },
};

const priorityConfig: Record<string, { bg: string; text: string }> = {
    critical: { bg: "bg-rose-500/20", text: "text-rose-400" },
    high: { bg: "bg-orange-500/20", text: "text-orange-400" },
    medium: { bg: "bg-blue-500/20", text: "text-blue-400" },
    low: { bg: "bg-slate-500/20", text: "text-slate-400" },
};

interface JobsTableProps {
    onStatsChange?: (stats: { queued: number; processing: number; completed: number; failed: number }) => void;
}

export function JobsTable({ onStatsChange }: JobsTableProps) {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [assignModal, setAssignModal] = useState<{ isOpen: boolean; jobId: string; jobKind: string }>({
        isOpen: false,
        jobId: "",
        jobKind: "",
    });

    // Update parent stats whenever jobs change
    useEffect(() => {
        if (onStatsChange) {
            const stats = {
                queued: jobs.filter(j => j.status === "queued").length,
                processing: jobs.filter(j => j.status === "processing").length,
                completed: jobs.filter(j => j.status === "completed").length,
                failed: jobs.filter(j => j.status === "failed").length,
            };
            onStatsChange(stats);
        }
    }, [jobs, onStatsChange]);

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.kind.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (job.assignee?.name.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesFilter = selectedFilter === "all" || job.status === selectedFilter;
        return matchesSearch && matchesFilter;
    });

    const handleAssign = (workerId: string, workerName: string) => {
        setJobs(prev => prev.map(job =>
            job.id === assignModal.jobId
                ? { ...job, assignee: { id: workerId, name: workerName }, status: "processing" }
                : job
        ));
    };

    const handleCreateJob = (jobData: { kind: string; priority: string; description: string }) => {
        const newJob: Job = {
            id: `job_${Math.random().toString(36).substr(2, 8)}`,
            kind: jobData.kind,
            status: "queued",
            priority: jobData.priority,
            created: "Just now",
            duration: "-",
            worker: "-",
            description: jobData.description,
        };
        setJobs(prev => [newJob, ...prev]);
    };

    const handleStartJob = (jobId: string) => {
        setJobs(prev => prev.map(job =>
            job.id === jobId ? { ...job, status: "processing" } : job
        ));
    };

    const handleCompleteJob = (jobId: string) => {
        setJobs(prev => prev.map(job =>
            job.id === jobId ? { ...job, status: "completed", duration: `${Math.floor(Math.random() * 500) + 50}ms` } : job
        ));
    };

    const handleRetryJob = (jobId: string) => {
        setJobs(prev => prev.map(job =>
            job.id === jobId ? { ...job, status: "queued" } : job
        ));
    };

    return (
        <>
            <div className="opacity-0 animate-fade-in-up stagger-5" style={{ animationFillMode: 'forwards' }}>
                <GlowCard className="overflow-hidden">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-white/5">
                        <div>
                            <h3 className="text-lg font-semibold">Recent Jobs</h3>
                            <p className="text-sm text-muted-foreground">
                                {jobs.length === 0 ? "No jobs yet" : `Showing ${filteredJobs.length} of ${jobs.length} jobs`}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Add Job Button */}
                            <button
                                onClick={() => setCreateModalOpen(true)}
                                className="flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-sm font-medium text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
                            >
                                <Plus className="h-4 w-4" />
                                Add Job
                            </button>

                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search jobs..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-9 w-48 rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
                                />
                            </div>

                            {/* Filter buttons */}
                            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
                                {["all", "queued", "processing", "completed", "failed"].map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setSelectedFilter(filter)}
                                        className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${selectedFilter === filter
                                                ? "bg-violet-500 text-white"
                                                : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                                            }`}
                                    >
                                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                    </button>
                                ))}
                            </div>

                            {/* Refresh */}
                            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all">
                                <RefreshCw className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Empty State or Table */}
                    {jobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 mb-4">
                                <Inbox className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h4 className="text-lg font-semibold mb-2">No jobs yet</h4>
                            <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
                                Create your first job to get started. You can choose the type and priority.
                            </p>
                            <button
                                onClick={() => setCreateModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-sm font-medium text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
                            >
                                <Plus className="h-4 w-4" />
                                Create First Job
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Table */}
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-white/5 hover:bg-transparent">
                                            <TableHead className="text-muted-foreground font-semibold">Job ID</TableHead>
                                            <TableHead className="text-muted-foreground font-semibold">Type</TableHead>
                                            <TableHead className="text-muted-foreground font-semibold">Assigned To</TableHead>
                                            <TableHead className="text-muted-foreground font-semibold">Status</TableHead>
                                            <TableHead className="text-muted-foreground font-semibold">Priority</TableHead>
                                            <TableHead className="text-muted-foreground font-semibold">Duration</TableHead>
                                            <TableHead className="text-muted-foreground font-semibold">Created</TableHead>
                                            <TableHead className="text-muted-foreground font-semibold w-10"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredJobs.map((job) => {
                                            const status = statusConfig[job.status];
                                            const priority = priorityConfig[job.priority];
                                            return (
                                                <TableRow
                                                    key={job.id}
                                                    className="border-white/5 group hover:bg-white/5 transition-colors cursor-pointer"
                                                >
                                                    <TableCell className="font-mono text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-violet-400">{job.id}</span>
                                                            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-medium">{job.kind}</TableCell>
                                                    <TableCell>
                                                        {job.assignee ? (
                                                            <div className="flex items-center gap-2">
                                                                <WorkerAvatar name={job.assignee.name} size="sm" />
                                                                <span className="text-sm">{job.assignee.name}</span>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setAssignModal({
                                                                    isOpen: true,
                                                                    jobId: job.id,
                                                                    jobKind: job.kind
                                                                })}
                                                                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-violet-400 transition-colors"
                                                            >
                                                                <UserPlus className="h-3.5 w-3.5" />
                                                                Assign
                                                            </button>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${status.bg} ${status.text}`}>
                                                            <span className={`h-1.5 w-1.5 rounded-full ${status.dot} ${job.status === 'processing' ? 'animate-pulse' : ''}`} />
                                                            {job.status}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`rounded-md px-2 py-1 text-xs font-medium ${priority.bg} ${priority.text}`}>
                                                            {job.priority}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm text-muted-foreground">
                                                        {job.duration}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">
                                                        {job.created}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {!job.assignee && (
                                                                <button
                                                                    onClick={() => setAssignModal({
                                                                        isOpen: true,
                                                                        jobId: job.id,
                                                                        jobKind: job.kind
                                                                    })}
                                                                    className="p-1.5 rounded-md hover:bg-white/10 text-violet-400"
                                                                    title="Assign"
                                                                >
                                                                    <UserPlus className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
                                                            {job.status === 'failed' && (
                                                                <button
                                                                    onClick={() => handleRetryJob(job.id)}
                                                                    className="p-1.5 rounded-md hover:bg-white/10 text-amber-400"
                                                                    title="Retry"
                                                                >
                                                                    <RotateCcw className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
                                                            {job.status === 'processing' && (
                                                                <button
                                                                    onClick={() => handleCompleteJob(job.id)}
                                                                    className="p-1.5 rounded-md hover:bg-white/10 text-emerald-400"
                                                                    title="Mark Complete"
                                                                >
                                                                    <Play className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
                                                            {job.status === 'queued' && (
                                                                <button
                                                                    onClick={() => handleStartJob(job.id)}
                                                                    className="p-1.5 rounded-md hover:bg-white/10 text-emerald-400"
                                                                    title="Start"
                                                                >
                                                                    <Play className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
                                                            <button className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground">
                                                                <MoreVertical className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between border-t border-white/5 px-6 py-4">
                                <p className="text-sm text-muted-foreground">
                                    Page {currentPage} of 1
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <button
                                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500 text-white font-medium"
                                    >
                                        1
                                    </button>
                                    <button
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={true}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </GlowCard>
            </div>

            {/* Create Job Modal */}
            <CreateJobModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onCreate={handleCreateJob}
            />

            {/* Assign Modal */}
            <AssignJobModal
                isOpen={assignModal.isOpen}
                onClose={() => setAssignModal({ isOpen: false, jobId: "", jobKind: "" })}
                jobId={assignModal.jobId}
                jobKind={assignModal.jobKind}
                onAssign={handleAssign}
            />
        </>
    );
}
