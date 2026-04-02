import mongoose from "mongoose";

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing. Add it to server/.env before starting the API.");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri);

  // eslint-disable-next-line no-console
  console.log("MongoDB connected successfully.");
}
