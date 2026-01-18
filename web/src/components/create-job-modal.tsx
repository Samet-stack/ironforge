"use client";

import { useState } from "react";
import { X, Plus, Briefcase } from "lucide-react";

interface CreateJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (job: { kind: string; priority: string; description: string }) => void;
}

const jobTypes = [
    { id: "email", name: "Email Notification", icon: "📧" },
    { id: "data", name: "Data Processing", icon: "📊" },
    { id: "image", name: "Image Resize", icon: "🖼️" },
    { id: "payment", name: "Payment Sync", icon: "💳" },
    { id: "report", name: "Report Generation", icon: "📄" },
    { id: "webhook", name: "Webhook Delivery", icon: "🔗" },
    { id: "cache", name: "Cache Invalidation", icon: "🗑️" },
    { id: "analytics", name: "Analytics Sync", icon: "📈" },
];

const priorities = [
    { id: "low", name: "Low", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
    { id: "medium", name: "Medium", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    { id: "high", name: "High", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
    { id: "critical", name: "Critical", color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
];

export function CreateJobModal({ isOpen, onClose, onCreate }: CreateJobModalProps) {
    const [selectedType, setSelectedType] = useState<string>("");
    const [selectedPriority, setSelectedPriority] = useState<string>("medium");
    const [description, setDescription] = useState<string>("");

    if (!isOpen) return null;

    const handleCreate = () => {
        if (selectedType) {
            const jobType = jobTypes.find(j => j.id === selectedType);
            onCreate({
                kind: jobType?.name || selectedType,
                priority: selectedPriority,
                description: description,
            });
            // Reset form
            setSelectedType("");
            setSelectedPriority("medium");
            setDescription("");
            onClose();
        }
    };

    const canCreate = selectedType !== "";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-card/95 shadow-2xl backdrop-blur-xl animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                            <Briefcase className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Create New Job</h2>
                            <p className="text-sm text-muted-foreground">Define job parameters</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Job Type */}
                    <div>
                        <label className="block text-sm font-medium mb-3">Job Type *</label>
                        <div className="grid grid-cols-2 gap-2">
                            {jobTypes.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setSelectedType(type.id)}
                                    className={`flex items-center gap-3 rounded-xl p-3 text-left transition-all border ${selectedType === type.id
                                            ? "bg-violet-500/20 border-violet-500/40"
                                            : "bg-white/5 border-white/10 hover:bg-white/10"
                                        }`}
                                >
                                    <span className="text-xl">{type.icon}</span>
                                    <span className="text-sm font-medium">{type.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-medium mb-3">Priority</label>
                        <div className="flex gap-2">
                            {priorities.map((priority) => (
                                <button
                                    key={priority.id}
                                    onClick={() => setSelectedPriority(priority.id)}
                                    className={`flex-1 rounded-xl py-2.5 px-4 text-sm font-medium transition-all border ${selectedPriority === priority.id
                                            ? priority.color + " ring-1 ring-current"
                                            : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    {priority.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description (optional) */}
                    <div>
                        <label className="block text-sm font-medium mb-3">Description (optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add any additional details about this job..."
                            rows={3}
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-white/5">
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!canCreate}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-sm font-medium text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        <Plus className="h-4 w-4" />
                        Create Job
                    </button>
                </div>
            </div>
        </div>
    );
}
