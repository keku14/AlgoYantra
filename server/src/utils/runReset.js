import "dotenv/config";

import mongoose from "mongoose";

import { connectDB } from "../config/db.js";

async function runReset() {
  await connectDB();
  await mongoose.connection.dropDatabase();
  // eslint-disable-next-line no-console
  console.log("Database reset complete.");
  await mongoose.connection.close();
  process.exit(0);
}

runReset().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error("Database reset failed:", error.message);
  try {
    await mongoose.connection.close();
  } catch {
    // ignore close failure
  }
  process.exit(1);
});
