import Assignment from "../models/Assignment.js";
import Classroom from "../models/Classroom.js";
import Lesson from "../models/Lesson.js";
import Submission from "../models/Submission.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireActiveClassroom } from "../utils/classroom.js";

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
  const { activeClassroom } = await requireActiveClassroom(req.user);
  const assignments = await Assignment.find({
    teacher: req.user._id,
    classroom: activeClassroom._id,
  }).lean();
  const assignmentIds = assignments.map((assignment) => assignment._id);
  const totalPossibleMarks = assignments.reduce((sum, assignment) => sum + Number(assignment.xpReward || 0), 0);
  const submissions = await Submission.find({
    assignment: { $in: assignmentIds },
  })
    .populate("student", "name email xp level streak")
    .populate("assignment", "title treeType xpReward")
    .lean();

  const activeClassroomWithStudents = await Classroom
    .findById(activeClassroom._id)
    .populate("students", "name email xp level streak")
    .lean();
  const students = activeClassroomWithStudents?.students || [];
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

  const leaderboard = [...studentReportMap.values()]
    .map((report) => ({
      name: report.name || "Student",
      totalXp: report.marksEarned,
      accuracy: report.averageScore,
      level: 1,
      streak: report.attempts,
    }))
    .sort((left, right) => (
      right.totalXp - left.totalXp
      || right.accuracy - left.accuracy
      || String(left.name).localeCompare(String(right.name))
    ))
    .slice(0, 8);

  res.status(200).json({
    overview: {
      totalStudents,
      activeAssignments: assignments.length,
      averageScore,
      liveSessionsEnabled: assignments.filter((assignment) => assignment.liveSessionEnabled).length,
    },
    activeClassroom,
    studentPerformance,
    studentReports,
    mistakeHeatmap,
    treeTypePerformance,
    recentSubmissions: submissions.slice(0, 6),
    leaderboard,
  });
});

export const getStudentOverview = asyncHandler(async (req, res) => {
  const { activeClassroom } = await requireActiveClassroom(req.user);
  const classroomAssignments = await Assignment.find({ classroom: activeClassroom._id }).lean();
  const assignmentIds = classroomAssignments.map((assignment) => assignment._id);
  const submissions = await Submission.find({
    student: req.user._id,
    assignment: { $in: assignmentIds },
  })
    .populate("assignment", "title treeType xpReward")
    .sort({ submittedAt: -1 })
    .lean();

  const totalXp = submissions.reduce((sum, submission) => (
    sum + Math.round((Number(submission.score || 0) / 100) * Number(submission.assignment?.xpReward || 0))
  ), 0);
  const accuracy = submissions.length
    ? round(submissions.reduce((sum, submission) => sum + Number(submission.score || 0), 0) / submissions.length)
    : 0;
  const groupedProgress = submissions.reduce((accumulator, submission) => {
    const treeType = submission.assignment?.treeType || "unknown";
    const existing = accumulator.get(treeType) || {
      treeType,
      title: treeType.toUpperCase(),
      mastery: 0,
      attempts: 0,
    };

    existing.mastery += Number(submission.score || 0);
    existing.attempts += 1;
    accumulator.set(treeType, existing);
    return accumulator;
  }, new Map());
  const progress = [...groupedProgress.values()].map((entry) => ({
    ...entry,
    mastery: round(entry.mastery / entry.attempts),
  }));
  const weakestTopic = [...progress].sort((left, right) => left.mastery - right.mastery)[0];
  const recommendedLessons = weakestTopic
    ? await Lesson.find({ type: weakestTopic.treeType }).limit(2).lean()
    : await Lesson.find().limit(2).lean();

  const assignmentBreakdown = submissions.reduce((accumulator, submission) => {
    accumulator[submission.assignment.treeType] = (accumulator[submission.assignment.treeType] || 0) + 1;
    return accumulator;
  }, {});

  const classroomRoster = await Classroom
    .findById(activeClassroom._id)
    .populate("students", "name email")
    .lean();
  const classStudentIds = (classroomRoster?.students || []).map((student) => student._id);
  const classSubmissions = await Submission.find({
    student: { $in: classStudentIds },
    assignment: { $in: assignmentIds },
  })
    .populate("student", "name")
    .populate("assignment", "xpReward")
    .lean();
  const leaderboardMap = classSubmissions.reduce((accumulator, submission) => {
    const key = String(submission.student?._id || submission.student);
    const current = accumulator.get(key) || {
      name: submission.student?.name || "Student",
      totalXp: 0,
      accuracy: 0,
      attempts: 0,
      level: 1,
    };

    current.totalXp += Math.round((Number(submission.score || 0) / 100) * Number(submission.assignment?.xpReward || 0));
    current.accuracy += Number(submission.score || 0);
    current.attempts += 1;
    accumulator.set(key, current);
    return accumulator;
  }, new Map());
  const leaderboard = [...leaderboardMap.values()]
    .map((entry) => ({
      ...entry,
      accuracy: entry.attempts ? round(entry.accuracy / entry.attempts) : 0,
    }))
    .sort((left, right) => (
      right.totalXp - left.totalXp
      || right.accuracy - left.accuracy
      || String(left.name).localeCompare(String(right.name))
    ))
    .slice(0, 8);

  res.status(200).json({
    overview: {
      accuracy,
      totalXp,
      level: Math.max(1, Math.floor(totalXp / 300) + 1),
      streak: submissions.length,
    },
    activeClassroom,
    progress,
    recentResults: submissions.slice(0, 8),
    assignmentBreakdown: Object.entries(assignmentBreakdown).map(([treeType, attempts]) => ({
      treeType,
      attempts,
    })),
    recommendedLessons,
    leaderboard,
  });
});

export const getLeaderboard = asyncHandler(async (req, res) => {
  const { activeClassroom } = await requireActiveClassroom(req.user);
  const classroomAssignments = await Assignment.find({ classroom: activeClassroom._id }).select("_id").lean();
  const classroom = await Classroom
    .findById(activeClassroom._id)
    .populate("students", "name")
    .lean();
  const submissions = await Submission.find({
    assignment: { $in: classroomAssignments.map((assignment) => assignment._id) },
    student: { $in: (classroom?.students || []).map((student) => student._id) },
  })
    .populate("student", "name")
    .populate("assignment", "xpReward")
    .lean();
  const leaderboardMap = submissions.reduce((accumulator, submission) => {
    const key = String(submission.student?._id || submission.student);
    const current = accumulator.get(key) || {
      name: submission.student?.name || "Student",
      totalXp: 0,
      accuracy: 0,
      level: 1,
      streak: 0,
    };

    current.totalXp += Math.round((Number(submission.score || 0) / 100) * Number(submission.assignment?.xpReward || 0));
    current.accuracy += Number(submission.score || 0);
    current.streak += 1;
    accumulator.set(key, current);
    return accumulator;
  }, new Map());
  const leaderboard = [...leaderboardMap.values()]
    .map((entry) => ({
      ...entry,
      accuracy: entry.streak ? round(entry.accuracy / entry.streak) : 0,
    }))
    .sort((left, right) => (
      right.totalXp - left.totalXp
      || right.accuracy - left.accuracy
      || String(left.name).localeCompare(String(right.name))
    ))
    .slice(0, 12);

  res.status(200).json({
    leaderboard,
  });
});
