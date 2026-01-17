"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

// Mock data
const jobs = [
    {
        id: "job_1a2b3c4d",
        kind: "Email Notification",
        status: "completed",
        priority: "High",
        created: "2 mins ago",
    },
    {
        id: "job_5e6f7g8h",
        kind: "Data Processing",
        status: "processing",
        priority: "Medium",
        created: "5 mins ago",
    },
    {
        id: "job_9i0j1k2l",
        kind: "Image Resize",
        status: "queued",
        priority: "Low",
        created: "10 mins ago",
    },
    {
        id: "job_3m4n5o6p",
        kind: "Payment Sync",
        status: "failed",
        priority: "Critical",
        created: "15 mins ago",
    },
    {
        id: "job_7q8r9s0t",
        kind: "Report Generation",
        status: "completed",
        priority: "Medium",
        created: "20 mins ago",
    },
    {
        id: "job_1u2v3w4x",
        kind: "Webhook Delivery",
        status: "retrying",
        priority: "High",
        created: "25 mins ago",
    },
];

const statusColors: Record<string, string> = {
    completed: "bg-green-500/20 text-green-400 border-green-500/30",
    processing: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    queued: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
    retrying: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export function JobsTable() {
    return (
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Recent Jobs</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="border-border/40 hover:bg-transparent">
                            <TableHead className="text-muted-foreground">ID</TableHead>
                            <TableHead className="text-muted-foreground">Kind</TableHead>
                            <TableHead className="text-muted-foreground">Status</TableHead>
                            <TableHead className="text-muted-foreground">Priority</TableHead>
                            <TableHead className="text-muted-foreground">Created</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {jobs.map((job) => (
                            <TableRow
                                key={job.id}
                                className="border-border/40 hover:bg-accent/50"
                            >
                                <TableCell className="font-mono text-sm">{job.id}</TableCell>
                                <TableCell>{job.kind}</TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={statusColors[job.status]}
                                    >
                                        {job.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{job.priority}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    {job.created}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
