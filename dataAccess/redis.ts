import { Redis } from "ioredis";
import path from "path";
import dotenv from "dotenv";

// Resolve config.env path
dotenv.config({
  path: path.resolve(__dirname, "../config/config.env"),
});

const redisClient = () => {
  if (process.env.REDIS_URL) {
    console.log("Redis connected!");
    return process.env.REDIS_URL;
  }
  throw new Error("Redis connection failed!");
};

export const redis = new Redis(redisClient());
