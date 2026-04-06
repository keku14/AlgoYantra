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
  const totalPossibleMarks = assignments.reduce((sum, assignment) => sum + Number(assignment.xpReward || 0), 0);
  const submissions = await Submission.find({
    assignment: { $in: assignmentIds },
  })
    .populate("student", "name email xp level streak")
    .populate("assignment", "title treeType xpReward")
    .lean();

  const students = await User.find({ role: "student" }).lean();
  const averageScore = submissions.length
    ? round(submissions.reduce((total, item) => total + item.score, 0) / submissions.length)
    : 0;

  const studentMap = new Map();
  const studentReportMap = new Map();
  const mistakeMap = new Map();
  const treeMap = new Map();

  function ensureStudentEntry(studentLike, fallbackKey) {
    const rawId = studentLike?._id ?? fallbackKey;

    if (!rawId) {
      return null;
    }

    const studentKey = String(rawId);

    if (!studentMap.has(studentKey)) {
      studentMap.set(studentKey, {
        studentId: rawId,
        name: studentLike?.name || "Student",
        email: studentLike?.email || "",
        averageScore: 0,
        attempts: 0,
        latestScore: 0,
        xp: Number(studentLike?.xp || 0),
        level: Number(studentLike?.level || 1),
        streak: Number(studentLike?.streak || 0),
      });
    }

    if (!studentReportMap.has(studentKey)) {
      studentReportMap.set(studentKey, {
        studentId: rawId,
        name: studentLike?.name || "Student",
        email: studentLike?.email || "",
        marksEarned: 0,
        marksPossible: totalPossibleMarks,
        attempts: 0,
        averageScore: 0,
        treeTypeBreakdown: {},
        assignments: [],
      });
    }

    return studentKey;
  }

  students.forEach((student) => {
    ensureStudentEntry(student, student._id);
  });

  submissions.forEach((submission) => {
    const studentKey = ensureStudentEntry(submission.student, submission.student);

    if (!studentKey) {
      return;
    }

    const current = studentMap.get(studentKey);

    current.averageScore += submission.score;
    current.attempts += 1;
    current.latestScore = submission.score;
    studentMap.set(studentKey, current);

    const report = studentReportMap.get(studentKey);
    const possibleMarks = Number(submission.assignment?.xpReward || 0);
    const earnedMarks = Math.round((Number(submission.score || 0) / 100) * possibleMarks);

    report.attempts += 1;
    report.averageScore += Number(submission.score || 0);
    report.marksEarned += earnedMarks;
    report.assignments.push({
      submissionId: submission._id,
      assignmentId: submission.assignment?._id,
      title: submission.assignment?.title || "Assignment",
      treeType: submission.assignment?.treeType || "unknown",
      score: submission.score,
      earnedMarks,
      possibleMarks,
      mistakes: submission.mistakes || [],
      suggestions: submission.suggestions || [],
      submittedAt: submission.submittedAt,
    });

    const treeTypeKey = submission.assignment?.treeType || "unknown";
    if (!report.treeTypeBreakdown[treeTypeKey]) {
      report.treeTypeBreakdown[treeTypeKey] = {
        treeType: treeTypeKey,
        attempts: 0,
        averageScore: 0,
        marksEarned: 0,
        marksPossible: 0,
      };
    }

    const treeEntry = report.treeTypeBreakdown[treeTypeKey];
    treeEntry.attempts += 1;
    treeEntry.averageScore += Number(submission.score || 0);
    treeEntry.marksEarned += earnedMarks;
    treeEntry.marksPossible += possibleMarks;

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
      averageScore: item.attempts ? round(item.averageScore / item.attempts) : 0,
    }))
    .sort((left, right) => right.averageScore - left.averageScore);

  const studentReports = [...studentReportMap.values()]
    .map((report) => ({
      ...report,
      averageScore: report.attempts ? round(report.averageScore / report.attempts) : 0,
      treeTypeBreakdown: Object.values(report.treeTypeBreakdown)
        .map((entry) => ({
          ...entry,
          averageScore: entry.attempts ? round(entry.averageScore / entry.attempts) : 0,
        }))
        .sort((left, right) => right.averageScore - left.averageScore),
      assignments: report.assignments.sort(
        (left, right) => new Date(right.submittedAt) - new Date(left.submittedAt),
      ),
    }))
    .sort((left, right) => right.averageScore - left.averageScore);
  const totalStudents = studentReportMap.size;

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
    studentReports,
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
