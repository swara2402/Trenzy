import mongoose from "mongoose";

export async function connectDB(mongoUri) {
  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI in backend environment variables.");
  }

  await mongoose.connect(mongoUri);
  console.log("[backend] MongoDB connected");
}
