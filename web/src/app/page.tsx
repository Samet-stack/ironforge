import { StatCard } from "@/components/stat-card";
import { ThroughputChart } from "@/components/throughput-chart";
import { JobsTable } from "@/components/jobs-table";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Jobs in Queue"
          value="1,234"
          subtitle="Active workers: 12"
          icon="queue"
          trend="+5% from yesterday"
        />
        <StatCard
          title="Processing"
          value="45"
          subtitle="Active workers: 12"
          icon="processing"
        />
        <StatCard
          title="Completed Today"
          value="5.2K"
          subtitle="Avg time: 120ms"
          icon="completed"
        />
        <StatCard
          title="Failed"
          value="12"
          subtitle="Retry rate: 2%"
          icon="failed"
        />
      </div>

      {/* Throughput Chart */}
      <ThroughputChart />

      {/* Jobs Table */}
      <JobsTable />
    </div>
  );
}
