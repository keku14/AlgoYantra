import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answers: {
      tree: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      traversals: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
      notes: {
        type: [String],
        default: [],
      },
    },
    score: {
      type: Number,
      default: 0,
    },
    mistakes: {
      type: [String],
      default: [],
    },
    suggestions: {
      type: [String],
      default: [],
    },
    correctTree: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    feedback: {
      type: String,
      default: "",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

const Submission = mongoose.model("Submission", submissionSchema);

export default Submission;
