import { Worker } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "../../api/src/lib/prisma.js";

const connection = new IORedis({
    host: "127.0.0.1",
    port: 6379,
    maxRetriesPerRequest: null,
});

const worker = new Worker(
    "nexus-jobs",
    async (job) => {
        console.log(`Processing job: ${job.name}`);

        if (job.name === "sla-check") {
            const issueId = job.data.issueId as string;

            const issue = await prisma.issue.findUnique({
                where: {
                    id: issueId,
                },
            });

            if (!issue) {
                console.log("Issue not found:", issueId);
                return;
            }

            if (issue.status === "DONE") {
                console.log("SLA check skipped: Issue already completed.");
                return;
            }

            console.warn(
                `SLA ALERT: Issue "${issue.title}" is overdue! Priority: ${issue.priority}`
            );
        }
    },
    { connection }
);

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, error) => {
    console.error(`Job ${job?.id} failed:`, error.message);
});

prisma.$connect()
    .then(() => console.log("Worker connected to PostgreSQL"))
    .catch((error) => console.error("Worker database error:", error.message));

console.log("Nexus background worker is running");

async function shutdown() {
    await worker.close();
    await connection.quit();
    process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);