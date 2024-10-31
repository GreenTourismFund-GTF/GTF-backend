import { v2 as cloudinary } from "cloudinary";
import path from "path";
import dotenv from "dotenv";

// Resolve config.env path
dotenv.config({
  path: path.resolve(__dirname, "../config/config.env"),
});

// Cloudinary config
export const cloudImageStore = () =>
  cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_SECRET_KEY,
  });
