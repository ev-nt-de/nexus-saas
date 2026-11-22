import IORedis from "ioredis";

export const redisConnection = new IORedis({
    host: "127.0.0.1",
    port: 6379,
    maxRetriesPerRequest: null,
});

redisConnection.on("connect", () => {
    console.log("Nexus API connected to Redis");
});

redisConnection.on("error", (error) => {
    console.error("Redis connection error:", error.message);
});