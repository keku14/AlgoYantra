import Classroom from "../models/Classroom.js";
import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  ensureClassroomOwnership,
  generateUniqueClassroomCode,
  serializeClassroom,
  syncActiveClassroom,
} from "../utils/classroom.js";

export const getMyClassrooms = asyncHandler(async (req, res) => {
  const { classrooms, activeClassroom } = await syncActiveClassroom(req.user);

  res.status(200).json({
    classrooms: classrooms.map(serializeClassroom),
    activeClassroom: serializeClassroom(activeClassroom),
  });
});

export const updateClassroom = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findById(req.params.classroomId)
    .populate("teacher", "name email")
    .populate("students", "name email xp level streak");

  if (!classroom) {
    const error = new Error("Classroom not found.");
    error.statusCode = 404;
    throw error;
  }

  ensureClassroomOwnership(req.user, classroom);

  const name = String(req.body.name || "").trim();
  const institution = String(req.body.institution || "").trim();
  const section = String(req.body.section || "").trim();

  if (!name) {
    const error = new Error("Classroom name is required.");
    error.statusCode = 400;
    throw error;
  }

  classroom.name = name;
  classroom.institution = institution;
  classroom.section = section;
  await classroom.save();

  res.status(200).json({
    classroom: serializeClassroom(classroom),
  });
});

export const createClassroom = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const institution = String(req.body.institution || "").trim();
  const section = String(req.body.section || "").trim();

  if (!name) {
    const error = new Error("Classroom name is required.");
    error.statusCode = 400;
    throw error;
  }

  const classroom = await Classroom.create({
    name,
    institution,
    section,
    teacher: req.user._id,
    code: await generateUniqueClassroomCode(),
  });

  req.user.activeClassroom = classroom._id;
  await req.user.save();

  const populatedClassroom = await Classroom.findById(classroom._id)
    .populate("teacher", "name email")
    .populate("students", "name email xp level streak");

  res.status(201).json({
    classroom: serializeClassroom(populatedClassroom),
    activeClassroom: serializeClassroom(populatedClassroom),
  });
});

export const joinClassroom = asyncHandler(async (req, res) => {
  const code = String(req.body.code || "").trim().toUpperCase();

  if (!code) {
    const error = new Error("Classroom code is required.");
    error.statusCode = 400;
    throw error;
  }

  const classroom = await Classroom.findOne({ code })
    .populate("teacher", "name email")
    .populate("students", "name email xp level streak");

  if (!classroom) {
    const error = new Error("No classroom found for that code.");
    error.statusCode = 404;
    throw error;
  }

  if (String(classroom.teacher?._id || classroom.teacher) === String(req.user._id)) {
    const error = new Error("You already own this classroom.");
    error.statusCode = 400;
    throw error;
  }

  if (!classroom.students.some((student) => String(student._id) === String(req.user._id))) {
    classroom.students.push(req.user._id);
    await classroom.save();
  }

  req.user.activeClassroom = classroom._id;
  await req.user.save();

  const refreshedClassroom = await Classroom.findById(classroom._id)
    .populate("teacher", "name email")
    .populate("students", "name email xp level streak");

  res.status(200).json({
    classroom: serializeClassroom(refreshedClassroom),
    activeClassroom: serializeClassroom(refreshedClassroom),
  });
});

export const leaveClassroom = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findById(req.params.classroomId);

  if (!classroom) {
    const error = new Error("Classroom not found.");
    error.statusCode = 404;
    throw error;
  }

  const isStudentMember = (classroom.students || []).some(
    (studentId) => String(studentId) === String(req.user._id),
  );

  if (!isStudentMember) {
    const error = new Error("You are not enrolled in this classroom.");
    error.statusCode = 404;
    throw error;
  }

  classroom.students = (classroom.students || []).filter(
    (studentId) => String(studentId) !== String(req.user._id),
  );
  await classroom.save();

  if (String(req.user.activeClassroom || "") === String(classroom._id)) {
    req.user.activeClassroom = null;
    await req.user.save();
  }

  res.status(200).json({
    message: "Classroom left successfully.",
    activeClassroom: null,
  });
});

export const setActiveClassroom = asyncHandler(async (req, res) => {
  const { classrooms } = await syncActiveClassroom(req.user);
  const nextClassroom = classrooms.find(
    (classroom) => String(classroom._id) === String(req.params.classroomId),
  );

  if (!nextClassroom) {
    const error = new Error("Classroom not found or not accessible.");
    error.statusCode = 404;
    throw error;
  }

  req.user.activeClassroom = nextClassroom._id;
  await req.user.save();

  res.status(200).json({
    activeClassroom: serializeClassroom(nextClassroom),
  });
});

export const clearActiveClassroom = asyncHandler(async (req, res) => {
  req.user.activeClassroom = null;
  await req.user.save();

  res.status(200).json({
    activeClassroom: null,
  });
});

export const getClassroomRoster = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findById(req.params.classroomId)
    .populate("teacher", "name email")
    .populate("students", "name email xp level streak");

  if (!classroom) {
    const error = new Error("Classroom not found.");
    error.statusCode = 404;
    throw error;
  }

  ensureClassroomOwnership(req.user, classroom);

  res.status(200).json({
    classroom: serializeClassroom(classroom),
    teacher: classroom.teacher,
    students: classroom.students,
  });
});

export const deleteClassroom = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findById(req.params.classroomId)
    .populate("students", "_id");

  if (!classroom) {
    const error = new Error("Classroom not found.");
    error.statusCode = 404;
    throw error;
  }

  ensureClassroomOwnership(req.user, classroom);

  const assignments = await Assignment.find({ classroom: classroom._id }).select("_id").lean();
  const assignmentIds = assignments.map((assignment) => assignment._id);

  if (assignmentIds.length) {
    await Submission.deleteMany({ assignment: { $in: assignmentIds } });
    await Assignment.deleteMany({ _id: { $in: assignmentIds } });
  }

  const studentIds = (classroom.students || []).map((student) => student._id || student);

  await classroom.deleteOne();

  const teacherFallback = await Classroom.findOne({ teacher: req.user._id }).sort({ createdAt: -1 }).lean();
  await User.findByIdAndUpdate(req.user._id, {
    activeClassroom: teacherFallback?._id || null,
  });

  if (studentIds.length) {
    const studentFallbacks = await Classroom.find({ students: { $in: studentIds } })
      .sort({ createdAt: -1 })
      .lean();

    const fallbackByStudent = new Map();
    studentFallbacks.forEach((candidate) => {
      (candidate.students || []).forEach((studentId) => {
        const key = String(studentId);

        if (studentIds.some((targetId) => String(targetId) === key) && !fallbackByStudent.has(key)) {
          fallbackByStudent.set(key, candidate._id);
        }
      });
    });

    await Promise.all(studentIds.map((studentId) => (
      User.findByIdAndUpdate(studentId, {
        activeClassroom: fallbackByStudent.get(String(studentId)) || null,
      })
    )));
  }

  res.status(200).json({
    message: "Classroom deleted successfully.",
  });
});
