import dotenv from "dotenv";
import path from "path";
import { cwd } from "process";

dotenv.config({ path: path.join(cwd(), ".env") });

const config = {
  NODE_ENV: process.env.NODE_ENV,
  database_url: process.env.DATABASE_URL!,
  port: Number(process.env.PORT || 5000),
};

export default config;
