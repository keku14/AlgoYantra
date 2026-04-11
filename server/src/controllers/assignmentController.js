import { simulateOperations } from "@algoyantra/shared";

import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireActiveClassroom } from "../utils/classroom.js";

function buildPreview(assignment) {
  if (assignment.solutionTree) {
    return {
      tree: assignment.solutionTree,
      steps: [],
      notes: [],
      traversals: [],
    };
  }

  return simulateOperations({
    treeType: assignment.treeType,
    initialTree: assignment.initialTree || null,
    operations: assignment.operations || [],
  });
}

export const getAssignments = asyncHandler(async (req, res) => {
  const { activeClassroom } = await requireActiveClassroom(req.user);
  const filters = req.user.role === "teacher"
    ? { teacher: req.user._id, classroom: activeClassroom._id }
    : { classroom: activeClassroom._id };
  const assignments = await Assignment.find(filters)
    .populate("classroom", "name code institution section")
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
  const { activeClassroom } = await requireActiveClassroom(req.user);
  const assignment = await Assignment.findById(req.params.assignmentId)
    .populate("classroom", "name code institution section")
    .populate("teacher", "name email")
    .populate("lesson", "title type summary");

  if (!assignment) {
    const error = new Error("Assignment not found.");
    error.statusCode = 404;
    throw error;
  }

  if (String(assignment.classroom?._id || assignment.classroom) !== String(activeClassroom._id)) {
    const error = new Error("Assignment not found in the active classroom.");
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
  const { activeClassroom } = await requireActiveClassroom(req.user);
  const { teacher: _ignoredTeacher, classroom: _ignoredClassroom, ...assignmentPayload } = req.body;
  const assignment = await Assignment.create({
    ...assignmentPayload,
    teacher: req.user._id,
    classroom: activeClassroom._id,
  });

  const populatedAssignment = await Assignment.findById(assignment._id)
    .populate("classroom", "name code institution section")
    .populate("teacher", "name email");

  res.status(201).json({
    assignment: populatedAssignment,
    solutionPreview: buildPreview(assignment.toObject()),
  });
});

export const updateAssignment = asyncHandler(async (req, res) => {
  const { activeClassroom } = await requireActiveClassroom(req.user);
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

  if (String(assignment.classroom) !== String(activeClassroom._id)) {
    const error = new Error("You can only update assignments in your active classroom.");
    error.statusCode = 403;
    throw error;
  }

  const { teacher: _ignoredTeacher, classroom: _ignoredClassroom, ...assignmentPayload } = req.body;

  Object.assign(assignment, assignmentPayload);
  assignment.classroom = activeClassroom._id;
  await assignment.save();

  const populatedAssignment = await Assignment.findById(assignment._id)
    .populate("classroom", "name code institution section")
    .populate("teacher", "name email");

  res.status(200).json({
    assignment: populatedAssignment,
    solutionPreview: buildPreview(assignment.toObject()),
  });
});

export const deleteAssignment = asyncHandler(async (req, res) => {
  const { activeClassroom } = await requireActiveClassroom(req.user);
  const assignment = await Assignment.findById(req.params.assignmentId);

  if (!assignment) {
    const error = new Error("Assignment not found.");
    error.statusCode = 404;
    throw error;
  }

  if (String(assignment.teacher) !== String(req.user._id)) {
    const error = new Error("You can only delete your own assignments.");
    error.statusCode = 403;
    throw error;
  }

  if (String(assignment.classroom) !== String(activeClassroom._id)) {
    const error = new Error("You can only delete assignments in your active classroom.");
    error.statusCode = 403;
    throw error;
  }

  await Submission.deleteMany({ assignment: assignment._id });
  await assignment.deleteOne();

  res.status(200).json({
    message: "Assignment deleted successfully.",
  });
});
