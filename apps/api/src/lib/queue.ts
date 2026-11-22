import { Queue } from "bullmq";
import { redisConnection } from "./redis.js";

export const nexusQueue = new Queue("nexus-jobs", {
    connection: redisConnection,
});

console.log("Nexus job queue initialized");