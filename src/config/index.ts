import dotenv from "dotenv";
import { access } from "fs";
import path from "path";
import { cwd } from "process";

dotenv.config({ path: path.join(cwd(), ".env") });

const config = {
  NODE_ENV: process.env.NODE_ENV,
  database_url: process.env.DATABASE_URL!,
  port: Number(process.env.PORT || 5000),
  salt: Number(process.env.SALT_ROUND),
  accessTokenSecret: process.env.ACCESS_SECRET!,
  refreshTokenSecret: process.env.REFRESH_SECRET!,
  refreshTokenExpireIn: process.env.EXPIRE_ACCESS_TOKEN!,
  accessTokenExpireIn: process.env.EXPIRE_REFRESH_TOKEN!,
};

export default config;
