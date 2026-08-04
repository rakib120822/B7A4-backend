import config from "./config";
import app from "./app";
import { prisma } from "./lib/prisma";

async function main() {
  if (config.NODE_ENV !== "production") {
    try {
      await prisma.$connect();
      console.log("database connected successfully");
      app.listen(config.port, async () => {
        console.log(`server is running localhost:${config.port}`);
      });
    } catch (error) {
      console.log("server.ts : ", error);
      await prisma.$disconnect();
      process.exit(1);
    }
  }
}

main();
export default app;
