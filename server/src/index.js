import "dotenv/config";
import http from "node:http";

import { Server } from "socket.io";

import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initializeSocket } from "./sockets/sessionSocket.js";
import { seedDatabase } from "./utils/seedData.js";

const port = Number(process.env.PORT) || 5001;

async function startServer() {
  await connectDB();

  if (String(process.env.AUTO_SEED).toLowerCase() === "true") {
    const seedResult = await seedDatabase();
    // eslint-disable-next-line no-console
    console.log("Seed status:", seedResult);
  }

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: (process.env.CLIENT_URL || "http://localhost:5173")
        .split(",")
        .map((origin) => origin.trim()),
      credentials: true,
    },
  });

  initializeSocket(io);
  app.set("io", io);

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`AlgoYantra server running on port ${port}`);
  });
}

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start AlgoYantra server:", error.message);
  process.exit(1);
});
