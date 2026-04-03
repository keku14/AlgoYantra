import Assignment from "../models/Assignment.js";
import Lesson from "../models/Lesson.js";
import Performance from "../models/Performance.js";
import Submission from "../models/Submission.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function round(value) {
  return Math.round(value * 10) / 10;
}

function bucketMistake(mistake) {
  const normalized = String(mistake).toLowerCase();

  if (normalized.includes("range") || normalized.includes("bst")) {
    return "BST reasoning";
  }

  if (normalized.includes("balance") || normalized.includes("rotation") || normalized.includes("avl")) {
    return "AVL balancing";
  }

  if (normalized.includes("red") || normalized.includes("black")) {
    return "RB coloring";
  }

  if (normalized.includes("traversal")) {
    return "Traversal order";
  }

  return "General structure";
}

export const getTeacherOverview = asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({ teacher: req.user._id }).lean();
  const assignmentIds = assignments.map((assignment) => assignment._id);
  const submissions = await Submission.find({
    assignment: { $in: assignmentIds },
  })
    .populate("student", "name email xp level streak")
    .populate("assignment", "title treeType xpReward")
    .lean();

  const students = await User.find({ role: "student" }).lean();
  const totalStudents = students.length;
  const averageScore = submissions.length
    ? round(submissions.reduce((total, item) => total + item.score, 0) / submissions.length)
    : 0;

  const studentMap = new Map();
  const mistakeMap = new Map();
  const treeMap = new Map();

  submissions.forEach((submission) => {
    const studentKey = String(submission.student._id);
    const current = studentMap.get(studentKey) || {
      studentId: submission.student._id,
      name: submission.student.name,
      averageScore: 0,
      attempts: 0,
      latestScore: 0,
      xp: submission.student.xp,
      level: submission.student.level,
      streak: submission.student.streak,
    };

    current.averageScore += submission.score;
    current.attempts += 1;
    current.latestScore = submission.score;
    studentMap.set(studentKey, current);

    submission.mistakes.forEach((mistake) => {
      const bucket = bucketMistake(mistake);
      mistakeMap.set(bucket, Number(mistakeMap.get(bucket) || 0) + 1);
    });

    const treeType = submission.assignment.treeType;
    const treeBucket = treeMap.get(treeType) || {
      treeType,
      averageScore: 0,
      attempts: 0,
    };

    treeBucket.averageScore += submission.score;
    treeBucket.attempts += 1;
    treeMap.set(treeType, treeBucket);
  });

  const studentPerformance = [...studentMap.values()]
    .map((item) => ({
      ...item,
      averageScore: round(item.averageScore / item.attempts),
    }))
    .sort((left, right) => right.averageScore - left.averageScore);

  const mistakeHeatmap = [...mistakeMap.entries()].map(([category, value]) => ({
    category,
    value,
  }));

  const treeTypePerformance = [...treeMap.values()].map((item) => ({
    treeType: item.treeType,
    averageScore: round(item.averageScore / item.attempts),
    attempts: item.attempts,
  }));

  const leaderboard = await Performance.find()
    .populate("student", "name")
    .sort({ totalXp: -1, accuracy: -1 })
    .limit(8)
    .lean();

  res.status(200).json({
    overview: {
      totalStudents,
      activeAssignments: assignments.length,
      averageScore,
      liveSessionsEnabled: assignments.filter((assignment) => assignment.liveSessionEnabled).length,
    },
    studentPerformance,
    mistakeHeatmap,
    treeTypePerformance,
    recentSubmissions: submissions.slice(0, 6),
    leaderboard: leaderboard.map((item) => ({
      name: item.student?.name || "Student",
      totalXp: item.totalXp,
      accuracy: item.accuracy,
      level: item.level,
      streak: item.streak,
    })),
  });
});

export const getStudentOverview = asyncHandler(async (req, res) => {
  const performance = await Performance.findOne({ student: req.user._id }).lean();
  const submissions = await Submission.find({ student: req.user._id })
    .populate("assignment", "title treeType xpReward")
    .sort({ submittedAt: -1 })
    .lean();

  const leaderboard = await Performance.find()
    .populate("student", "name")
    .sort({ totalXp: -1, accuracy: -1 })
    .limit(8)
    .lean();

  const progress = performance?.progress || [];
  const weakestTopic = [...progress].sort((left, right) => left.mastery - right.mastery)[0];
  const recommendedLessons = weakestTopic
    ? await Lesson.find({ type: weakestTopic.treeType }).limit(2).lean()
    : await Lesson.find().limit(2).lean();

  const assignmentBreakdown = submissions.reduce((accumulator, submission) => {
    accumulator[submission.assignment.treeType] =
      (accumulator[submission.assignment.treeType] || 0) + 1;
    return accumulator;
  }, {});

  res.status(200).json({
    overview: {
      accuracy: performance?.accuracy || 0,
      totalXp: performance?.totalXp || req.user.xp || 0,
      level: performance?.level || req.user.level || 1,
      streak: performance?.streak || req.user.streak || 0,
    },
    progress,
    recentResults: submissions.slice(0, 8),
    assignmentBreakdown: Object.entries(assignmentBreakdown).map(([treeType, attempts]) => ({
      treeType,
      attempts,
    })),
    recommendedLessons,
    leaderboard: leaderboard.map((item) => ({
      name: item.student?.name || "Student",
      totalXp: item.totalXp,
      accuracy: item.accuracy,
      level: item.level,
    })),
  });
});

export const getLeaderboard = asyncHandler(async (_req, res) => {
  const leaderboard = await Performance.find()
    .populate("student", "name")
    .sort({ totalXp: -1, accuracy: -1 })
    .limit(12)
    .lean();

  res.status(200).json({
    leaderboard: leaderboard.map((item) => ({
      name: item.student?.name || "Student",
      totalXp: item.totalXp,
      accuracy: item.accuracy,
      level: item.level,
      streak: item.streak,
    })),
  });
});
