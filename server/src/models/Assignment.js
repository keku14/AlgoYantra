import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
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
    promptValues: {
      type: [Number],
      default: [],
    },
    referenceImageUrl: {
      type: String,
      default: "",
    },
    solutionTree: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
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
      default: 100,
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

assignmentSchema.index({ classroom: 1, createdAt: -1 });
assignmentSchema.index({ teacher: 1, classroom: 1 });

const Assignment = mongoose.model("Assignment", assignmentSchema);

export default Assignment;
