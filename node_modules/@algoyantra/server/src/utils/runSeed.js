import "dotenv/config";

import { connectDB } from "../config/db.js";
import { seedDatabase } from "./seedData.js";

async function runSeed() {
  await connectDB();
  const result = await seedDatabase();
  // eslint-disable-next-line no-console
  console.log("Seed result:", result);
  process.exit(0);
}

runSeed().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Seed failed:", error.message);
  process.exit(1);
});
