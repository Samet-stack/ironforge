"use client";

import { useState, useEffect } from "react";
import { Plus, Search, GitBranch } from "lucide-react";
import { WorkflowCard, WorkflowStatus } from "@/components/workflow-card";
import { WorkflowBuilderModal } from "@/components/workflow-builder-modal";

// Mock data
const mockWorkflows = [
    {
        id: "wf_8923472",
        name: "Monthly Billing Cycle",
        status: "running" as WorkflowStatus,
        progress: 45,
        nodesTotal: 12,
        nodesCompleted: 5,
        createdAt: "2 mins ago"
    },
    {
        id: "wf_8923473",
        name: "User Onboarding Flow",
        status: "completed" as WorkflowStatus,
        progress: 100,
        nodesTotal: 8,
        nodesCompleted: 8,
        createdAt: "1 hour ago"
    },
    {
        id: "wf_8923474",
        name: "Data Export (GDPR)",
        status: "failed" as WorkflowStatus,
        progress: 80,
        nodesTotal: 5,
        nodesCompleted: 4,
        createdAt: "3 hours ago"
    },
    {
        id: "wf_8923475",
        name: "Email Campaign #42",
        status: "pending" as WorkflowStatus,
        progress: 0,
        nodesTotal: 150,
        nodesCompleted: 0,
        createdAt: "Just now"
    }
];

export default function WorkflowsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [workflows, setWorkflows] = useState(mockWorkflows);

    const handleCreateWorkflow = async (json: string) => {
        try {
            // Call OCaml Backend
            const res = await fetch("http://localhost:8080/workflow", {
                method: "POST",
                body: json,
                headers: { "Content-Type": "application/json" }
            });

            if (!res.ok) throw new Error("Failed to create workflow");

            // Add to list (optimistic)
            const data = await res.json();
            const newWorkflow = {
                id: data.workflow_id || "wf_new",
                name: "New Workflow",
                status: "running" as WorkflowStatus,
                progress: 0,
                nodesTotal: 0, // Unknown initially
                nodesCompleted: 0,
                createdAt: "Just now"
            };

            setWorkflows([newWorkflow, ...workflows]);
        } catch (err) {
            console.error(err);
            alert("Failed to submit workflow to OCaml backend (is it running?)");
        }
    };

    return (
        <main className="min-h-screen bg-[#0A0A0B] text-white pl-72">
            <div className="p-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white glow-text-cyan">
                            Workflows
                        </h1>
                        <p className="mt-2 text-muted-foreground">
                            Orchestrate complex task dependencies with the DAG Engine.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 hover:shadow-cyan-500/40"
                        >
                            <Plus className="h-4 w-4" />
                            New Workflow
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search workflows..."
                            className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all"
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {workflows.map((wf) => (
                        <WorkflowCard key={wf.id} {...wf} />
                    ))}

                    {/* Empty State / Add New Card */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="group flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 transition-all hover:border-cyan-500/30 hover:bg-cyan-500/[0.02]"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 group-hover:bg-cyan-500/10 transition-colors">
                            <GitBranch className="h-6 w-6 text-muted-foreground group-hover:text-cyan-400" />
                        </div>
                        <p className="font-medium text-muted-foreground group-hover:text-cyan-400">Create New Workflow</p>
                    </button>
                </div>
            </div>

            <WorkflowBuilderModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateWorkflow}
            />
        </main>
    );
}
