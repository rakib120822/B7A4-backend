import { createClient } from "redis";
import config from "../config";

export const redisClient = createClient({
  username: config.redis_username,
  password: config.redis_password,
  socket: {
    host: config.redis_host,
    port: config.redis_port,
  },
});

redisClient.on("error", (error) => {
  console.error("Redis error:", error);
});

let connecting: Promise<unknown> | null = null;

// node-redis must be connected explicitly. In production server.ts never runs
// main(), so connect lazily on first use and reuse the client afterwards.
export const getRedis = async () => {
  if (!redisClient.isOpen) {
    connecting ??= redisClient.connect().finally(() => {
      connecting = null;
    });
    await connecting;
  }
  return redisClient;
};
