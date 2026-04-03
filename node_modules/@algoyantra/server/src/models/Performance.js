import mongoose from "mongoose";

const performanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    history: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    progress: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    totalXp: {
      type: Number,
      default: 0,
    },
    streak: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    lastSubmissionAt: Date,
  },
  {
    timestamps: true,
  },
);

const Performance = mongoose.model("Performance", performanceSchema);

export default Performance;
