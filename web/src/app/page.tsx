import { StatCard } from "@/components/stat-card";
import { ThroughputChart } from "@/components/throughput-chart";
import { JobsTable } from "@/components/jobs-table";
import { Zap, Clock, Server, Activity } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="opacity-0 animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, <span className="gradient-text">CEO</span>
            </h1>
            <p className="mt-2 text-muted-foreground">
              Here's what's happening with your job queue today.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Quick stats */}
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                <Activity className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Uptime</p>
                <p className="text-sm font-semibold">99.98%</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20">
                <Server className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Workers</p>
                <p className="text-sm font-semibold">6 Ready</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20">
                <Clock className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg. Latency</p>
                <p className="text-sm font-semibold">-</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Start at 0 */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Jobs in Queue"
          value={0}
          subtitle="Add jobs to get started"
          icon="queue"
          delay={100}
        />
        <StatCard
          title="Processing"
          value={0}
          subtitle="Assign jobs to workers"
          icon="processing"
          delay={200}
        />
        <StatCard
          title="Completed Today"
          value={0}
          subtitle="No jobs completed yet"
          icon="completed"
          delay={300}
        />
        <StatCard
          title="Failed"
          value={0}
          subtitle="No failures"
          icon="failed"
          delay={400}
        />
      </div>

      {/* Throughput Chart */}
      <ThroughputChart />

      {/* Jobs Table */}
      <JobsTable />

      {/* Footer info */}
      <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground/50">
        <Zap className="h-3 w-3" />
        <span>Powered by IronForge v1.0.0</span>
        <span>•</span>
        <span>Last updated: just now</span>
      </div>
    </div>
  );
}
