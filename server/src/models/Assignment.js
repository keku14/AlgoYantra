import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    treeType: {
      type: String,
      required: true,
      enum: ["binary-tree", "bst", "avl", "red-black"],
    },
    initialTree: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    constraints: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    operations: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    expectedRules: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Intermediate",
    },
    xpReward: {
      type: Number,
      default: 120,
    },
    dueDate: Date,
    liveSessionEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const Assignment = mongoose.model("Assignment", assignmentSchema);

export default Assignment;
