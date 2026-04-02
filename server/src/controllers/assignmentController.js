import { simulateOperations } from "@algoyantra/shared";

import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function buildPreview(assignment) {
  return simulateOperations({
    treeType: assignment.treeType,
    initialTree: assignment.initialTree || null,
    operations: assignment.operations || [],
  });
}

export const getAssignments = asyncHandler(async (req, res) => {
  const filters = req.user.role === "teacher" ? { teacher: req.user._id } : {};
  const assignments = await Assignment.find(filters)
    .populate("teacher", "name email")
    .populate("lesson", "title type")
    .sort({ createdAt: -1 });

  if (req.user.role === "student") {
    const submissions = await Submission.find({
      student: req.user._id,
      assignment: { $in: assignments.map((assignment) => assignment._id) },
    }).select("assignment score submittedAt");

    const submissionMap = new Map(
      submissions.map((submission) => [String(submission.assignment), submission]),
    );

    res.status(200).json({
      assignments: assignments.map((assignment) => ({
        ...assignment.toObject(),
        submission: submissionMap.get(String(assignment._id)) || null,
      })),
    });
    return;
  }

  res.status(200).json({
    assignments,
  });
});

export const getAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.assignmentId)
    .populate("teacher", "name email")
    .populate("lesson", "title type summary");

  if (!assignment) {
    const error = new Error("Assignment not found.");
    error.statusCode = 404;
    throw error;
  }

  const response = {
    assignment,
  };

  if (req.user.role === "student") {
    response.submission = await Submission.findOne({
      assignment: assignment._id,
      student: req.user._id,
    });
  } else {
    response.solutionPreview = buildPreview(assignment.toObject());
  }

  res.status(200).json(response);
});

export const createAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.create({
    ...req.body,
    teacher: req.user._id,
  });

  res.status(201).json({
    assignment,
    solutionPreview: buildPreview(assignment.toObject()),
  });
});

export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.assignmentId);

  if (!assignment) {
    const error = new Error("Assignment not found.");
    error.statusCode = 404;
    throw error;
  }

  if (String(assignment.teacher) !== String(req.user._id)) {
    const error = new Error("You can only update your own assignments.");
    error.statusCode = 403;
    throw error;
  }

  Object.assign(assignment, req.body);
  await assignment.save();

  res.status(200).json({
    assignment,
    solutionPreview: buildPreview(assignment.toObject()),
  });
});
