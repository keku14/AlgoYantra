import { evaluateSubmission } from "@algoyantra/shared";

import Assignment from "../models/Assignment.js";
import Performance from "../models/Performance.js";
import Submission from "../models/Submission.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireActiveClassroom } from "../utils/classroom.js";

function buildFeedback(score) {
  if (score >= 90) {
    return "Excellent work. Your tree satisfies the required invariants with very strong precision.";
  }

  if (score >= 75) {
    return "Good progress. The core reasoning is there, and a few small corrections will make it solid.";
  }

  if (score >= 50) {
    return "You are close, but the tree still breaks one or more algorithmic constraints.";
  }

  return "Start by rebuilding the tree operation by operation and checking the invariant after each step.";
}

async function updatePerformance(studentId, assignment, score, treeType, xpDelta) {
  const performance =
    (await Performance.findOne({ student: studentId })) ||
    (await Performance.create({
      student: studentId,
      history: [],
      progress: [],
    }));

  performance.history.push({
    assignmentTitle: assignment.title,
    treeType,
    score,
    xpGained: xpDelta,
    completedAt: new Date(),
  });

  performance.totalXp += xpDelta;
  performance.level = Math.max(1, Math.floor(performance.totalXp / 300) + 1);
  performance.streak = Math.max(1, performance.streak + 1);
  performance.lastSubmissionAt = new Date();
  performance.accuracy = Math.round(
    performance.history.reduce((total, item) => total + item.score, 0) / performance.history.length,
  );

  const progressIndex = performance.progress.findIndex((item) => item.treeType === treeType);
  const nextProgress = {
    treeType,
    title: assignment.treeType.toUpperCase(),
    mastery: score,
    attempts:
      progressIndex >= 0 ? Number(performance.progress[progressIndex].attempts || 0) + 1 : 1,
  };

  if (progressIndex >= 0) {
    performance.progress[progressIndex] = nextProgress;
  } else {
    performance.progress.push(nextProgress);
  }

  await performance.save();

  await User.findByIdAndUpdate(studentId, {
    $inc: { xp: xpDelta },
    level: performance.level,
    streak: performance.streak,
    lastActiveAt: new Date(),
  });

  return performance;
}

export const submitAssignment = asyncHandler(async (req, res) => {
  const { activeClassroom } = await requireActiveClassroom(req.user);
  const assignment = await Assignment.findById(req.params.assignmentId);

  if (!assignment) {
    const error = new Error("Assignment not found.");
    error.statusCode = 404;
    throw error;
  }

  if (String(assignment.classroom) !== String(activeClassroom._id)) {
    const error = new Error("Assignment not found in the active classroom.");
    error.statusCode = 404;
    throw error;
  }

  const evaluation = evaluateSubmission({
    treeType: assignment.treeType,
    assignment: assignment.toObject(),
    submissionTree: req.body.tree,
    submittedTraversals: req.body.traversals || [],
  });

  const previousSubmission = await Submission.findOne({
    assignment: assignment._id,
    student: req.user._id,
  });

  const previousXp = previousSubmission
    ? Math.round((previousSubmission.score / 100) * assignment.xpReward)
    : 0;
  const nextXp = Math.round((evaluation.score / 100) * assignment.xpReward);
  const xpDelta = Math.max(0, nextXp - previousXp);

  const submission = await Submission.findOneAndUpdate(
    {
      assignment: assignment._id,
      student: req.user._id,
    },
    {
      assignment: assignment._id,
      student: req.user._id,
      answers: {
        tree: req.body.tree,
        traversals: req.body.traversals || [],
        notes: req.body.notes || [],
      },
      score: evaluation.score,
      mistakes: evaluation.mistakes,
      suggestions: evaluation.suggestions,
      correctTree: evaluation.correctTree,
      feedback: buildFeedback(evaluation.score),
      submittedAt: new Date(),
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  ).populate("assignment", "title treeType xpReward");

  const performance = await updatePerformance(
    req.user._id,
    assignment,
    evaluation.score,
    assignment.treeType,
    xpDelta,
  );

  res.status(200).json({
    submission,
    evaluation,
    xpAwarded: xpDelta,
    performance,
  });
});

export const getMySubmissions = asyncHandler(async (req, res) => {
  const { activeClassroom } = await requireActiveClassroom(req.user);
  const classroomAssignments = await Assignment.find({ classroom: activeClassroom._id }).select("_id").lean();
  const submissions = await Submission.find({ student: req.user._id })
    .where("assignment").in(classroomAssignments.map((assignment) => assignment._id))
    .populate("assignment", "title treeType xpReward")
    .sort({ submittedAt: -1 });

  res.status(200).json({
    submissions,
  });
});

export const getAssignmentSubmissions = asyncHandler(async (req, res) => {
  const { activeClassroom } = await requireActiveClassroom(req.user);
  const assignment = await Assignment.findById(req.params.assignmentId);

  if (!assignment) {
    const error = new Error("Assignment not found.");
    error.statusCode = 404;
    throw error;
  }

  if (String(assignment.teacher) !== String(req.user._id)) {
    const error = new Error("You can only view submissions for your own assignments.");
    error.statusCode = 403;
    throw error;
  }

  if (String(assignment.classroom) !== String(activeClassroom._id)) {
    const error = new Error("Assignment not found in the active classroom.");
    error.statusCode = 404;
    throw error;
  }

  const submissions = await Submission.find({ assignment: assignment._id })
    .populate("student", "name email xp level streak")
    .sort({ score: -1, submittedAt: -1 });

  res.status(200).json({
    submissions,
  });
});
