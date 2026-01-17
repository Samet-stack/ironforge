"use client";

import { useState } from "react";
import { X, Search, UserPlus, Check } from "lucide-react";
import { WorkerAvatar } from "@/components/worker-avatar";

interface Worker {
    id: string;
    name: string;
    role: string;
    status: "online" | "busy" | "offline";
    assignedJobs: number;
}

interface AssignJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobId: string;
    jobKind: string;
    onAssign: (workerId: string, workerName: string) => void;
}

// Mock workers data
const workers: Worker[] = [
    { id: "worker-1", name: "Alice Martin", role: "Senior Developer", status: "online", assignedJobs: 8 },
    { id: "worker-2", name: "Bob Johnson", role: "Backend Engineer", status: "busy", assignedJobs: 12 },
    { id: "worker-3", name: "Claire Dubois", role: "DevOps Engineer", status: "online", assignedJobs: 5 },
    { id: "worker-4", name: "David Chen", role: "Full Stack Developer", status: "online", assignedJobs: 6 },
    { id: "worker-5", name: "Emma Wilson", role: "Data Engineer", status: "offline", assignedJobs: 0 },
    { id: "worker-6", name: "Frank Miller", role: "Junior Developer", status: "busy", assignedJobs: 3 },
];

export function AssignJobModal({ isOpen, onClose, jobId, jobKind, onAssign }: AssignJobModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedWorker, setSelectedWorker] = useState<string | null>(null);

    if (!isOpen) return null;

    const filteredWorkers = workers.filter(worker =>
        worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        worker.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAssign = () => {
        if (selectedWorker) {
            const worker = workers.find(w => w.id === selectedWorker);
            if (worker) {
                onAssign(worker.id, worker.name);
                onClose();
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-card/95 shadow-2xl backdrop-blur-xl animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div>
                        <h2 className="text-lg font-semibold">Assign Job</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {jobKind} • <span className="text-violet-400 font-mono">{jobId}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-white/5">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search workers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
                        />
                    </div>
                </div>

                {/* Workers List */}
                <div className="max-h-[300px] overflow-y-auto p-2">
                    {filteredWorkers.map((worker) => (
                        <button
                            key={worker.id}
                            onClick={() => setSelectedWorker(worker.id)}
                            disabled={worker.status === "offline"}
                            className={`w-full flex items-center gap-3 rounded-xl p-3 transition-all ${selectedWorker === worker.id
                                    ? "bg-violet-500/20 border border-violet-500/40"
                                    : "hover:bg-white/5 border border-transparent"
                                } ${worker.status === "offline" ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            <WorkerAvatar
                                name={worker.name}
                                size="md"
                                showStatus
                                status={worker.status}
                            />
                            <div className="flex-1 text-left">
                                <p className="font-medium">{worker.name}</p>
                                <p className="text-xs text-muted-foreground">{worker.role}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium">{worker.assignedJobs}</p>
                                <p className="text-xs text-muted-foreground">jobs</p>
                            </div>
                            {selectedWorker === worker.id && (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500">
                                    <Check className="h-3.5 w-3.5 text-white" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-white/5">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={!selectedWorker}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-sm font-medium text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        <UserPlus className="h-4 w-4" />
                        Assign
                    </button>
                </div>
            </div>
        </div>
    );
}
