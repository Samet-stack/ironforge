"use client";

import { useState } from "react";
import { Save, Shield, Database, Bell, Layout } from "lucide-react";

export default function SettingsPage() {
    const [apiKey, setApiKey] = useState("sk_live_51M...");
    const [webhookUrl, setWebhookUrl] = useState("https://api.myapp.com/webhooks/ironforge");

    return (
        <main className="min-h-screen bg-[#0A0A0B] text-white pl-72">
            <div className="p-8 max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white glow-text-cyan mb-2">
                        Settings
                    </h1>
                    <p className="text-muted-foreground">
                        Configure your IronForge instance and manage access keys.
                    </p>
                </div>

                {/* API Keys Section */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <Shield className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">API Configuration</h2>
                            <p className="text-sm text-muted-foreground">Manage your secret keys for accessing the Queue API.</p>
                        </div>
                    </div>

                    <div className="space-y-4 max-w-2xl">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Secret Key</label>
                            <div className="flex gap-2">
                                <input
                                    type="password"
                                    value={apiKey}
                                    readOnly
                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-sm text-white focus:outline-none focus:border-cyan-500/50"
                                />
                                <button className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-medium transition-colors">
                                    Roll Key
                                </button>
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Use this key to authenticate requests from your backend servers. Do not share it with client-side code.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Queue Config */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                            <Database className="h-5 w-5 text-cyan-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Queue Defaults</h2>
                            <p className="text-sm text-muted-foreground">Set global default behaviors for job processing.</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 max-w-2xl">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Default Timeout (ms)</label>
                            <input
                                type="number"
                                defaultValue={30000}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Max Retries</label>
                            <input
                                type="number"
                                defaultValue={3}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Webhook URL</label>
                            <input
                                type="url"
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Theme / Appearance */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
                            <Layout className="h-5 w-5 text-violet-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Appearance</h2>
                            <p className="text-sm text-muted-foreground">Customize the dashboard look and feel.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="h-24 w-40 rounded-xl border-2 border-cyan-500 bg-black p-2 ring-4 ring-cyan-500/20">
                            <div className="h-full w-full rounded bg-gradient-to-br from-cyan-900/20 to-black"></div>
                            <span className="mt-2 block text-center text-xs font-medium text-cyan-500">Cyber Cyan</span>
                        </button>
                        <button className="h-24 w-40 rounded-xl border border-white/10 bg-black p-2 opacity-50 hover:opacity-100 transition-opacity">
                            <div className="h-full w-full rounded bg-gradient-to-br from-violet-900/20 to-black"></div>
                            <span className="mt-2 block text-center text-xs font-medium text-muted-foreground">Deep Violet</span>
                        </button>
                    </div>
                </div>

                {/* Save Button */}
                <div className="fixed bottom-8 right-8">
                    <button className="flex items-center gap-2 rounded-xl bg-white text-black px-6 py-3 font-bold shadow-2xl hover:bg-gray-200 transition-colors">
                        <Save className="h-5 w-5" />
                        Save Changes
                    </button>
                </div>
            </div>
        </main>
    );
}
