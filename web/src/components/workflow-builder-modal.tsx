"use client";

import { useState } from "react";
import { X, Play, Code2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (json: string) => Promise<void>;
}

const defaultJson = `{
  "workflow_id": "payment_process_001",
  "steps": [
    {
      "id": "validate_payment",
      "kind": "payment.validate",
      "depends_on": []
    },
    {
      "id": "charge_card",
      "kind": "payment.charge",
      "depends_on": ["validate_payment"]
    },
    {
      "id": "send_email",
      "kind": "email.send",
      "depends_on": ["charge_card"]
    }
  ]
}`;

export function WorkflowBuilderModal({ isOpen, onClose, onSubmit }: WorkflowBuilderModalProps) {
    const [json, setJson] = useState(defaultJson);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        try {
            setError(null);
            setIsSubmitting(true);

            // Validate JSON
            JSON.parse(json);

            await onSubmit(json);
            onClose();
        } catch (e) {
            setError("Invalid JSON format");
        } finally {
            setIsSubmitting(false);
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
            <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-card/95 shadow-2xl backdrop-blur-xl animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                            <Code2 className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">New Workflow</h2>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Define your DAG workflow using JSON
                            </p>
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
                <div className="p-6 space-y-4">
                    <div className="relative">
                        <textarea
                            value={json}
                            onChange={(e) => setJson(e.target.value)}
                            className="w-full h-[300px] rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-sm text-cyan-50/90 placeholder:text-muted-foreground focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none"
                            spellCheck={false}
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-white/5 bg-white/[0.02]">
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all",
                            isSubmitting && "opacity-70 cursor-wait"
                        )}
                    >
                        <Play className="h-4 w-4 fill-current" />
                        {isSubmitting ? "Submitting..." : "Start Workflow"}
                    </button>
                </div>
            </div>
        </div>
    );
}
