import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["binary-tree", "bst", "avl", "red-black"],
    },
    content: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    visualizationData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    durationMinutes: {
      type: Number,
      default: 20,
    },
    published: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const Lesson = mongoose.model("Lesson", lessonSchema);

export default Lesson;
