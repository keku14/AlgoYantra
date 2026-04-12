import Assignment from "../models/Assignment.js";
import Classroom from "../models/Classroom.js";
import Submission from "../models/Submission.js";
import User from "../models/User.js";

function randomCodeSegment(length) {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let output = "";

  for (let index = 0; index < length; index += 1) {
    output += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return output;
}

export async function generateUniqueClassroomCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = `${randomCodeSegment(3)}-${randomCodeSegment(3)}`;
    const existingClassroom = await Classroom.findOne({ code }).select("_id").lean();

    if (!existingClassroom) {
      return code;
    }
  }

  const error = new Error("Unable to generate a unique classroom code. Please try again.");
  error.statusCode = 500;
  throw error;
}

export function serializeClassroom(classroom) {
  if (!classroom) {
    return null;
  }

  const pendingAssignmentCount = Number(classroom.pendingAssignmentCount || 0);
  const value = classroom.toObject ? classroom.toObject() : classroom;
  const students = Array.isArray(value.students) ? value.students : [];

  return {
    _id: value._id,
    name: value.name,
    institution: value.institution || "",
    section: value.section || "",
    code: value.code,
    teacher: value.teacher,
    studentCount: students.length,
    pendingAssignmentCount,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export async function getUserClassrooms(user) {
  const query = user.role === "teacher"
    ? { teacher: user._id }
    : { students: user._id };

  return Classroom.find(query)
    .populate("teacher", "name email")
    .populate("students", "name email xp level streak")
    .sort({ createdAt: -1 });
}

async function ensureLegacyClassroomForTeacherId(teacherId) {
  const legacyAssignments = await Assignment.find({
    teacher: teacherId,
    $or: [
      { classroom: { $exists: false } },
      { classroom: null },
    ],
  }).select("_id").lean();

  if (!legacyAssignments.length) {
    return null;
  }

  const teacher = await User.findById(teacherId).select("name activeClassroom");

  if (!teacher) {
    return null;
  }

  const studentIds = await Submission.find({
    assignment: { $in: legacyAssignments.map((assignment) => assignment._id) },
  }).distinct("student");

  const classroom = await Classroom.create({
    name: `${teacher.name}'s Legacy Classroom`,
    institution: "",
    section: "Imported",
    code: await generateUniqueClassroomCode(),
    teacher: teacherId,
    students: studentIds,
  });

  await Assignment.updateMany(
    { _id: { $in: legacyAssignments.map((assignment) => assignment._id) } },
    { $set: { classroom: classroom._id } },
  );

  return classroom;
}

async function ensureLegacyClassroomsForUser(user) {
  if (user.role === "teacher") {
    await ensureLegacyClassroomForTeacherId(user._id);
    return;
  }

  const legacySubmissions = await Submission.find({ student: user._id })
    .populate("assignment", "teacher classroom")
    .select("assignment")
    .lean();
  const teacherIds = [...new Set(
    legacySubmissions
      .map((submission) => submission.assignment)
      .filter((assignment) => assignment && !assignment.classroom)
      .map((assignment) => String(assignment.teacher)),
  )];

  await Promise.all(teacherIds.map((teacherId) => ensureLegacyClassroomForTeacherId(teacherId)));
}

export async function syncActiveClassroom(user) {
  await ensureLegacyClassroomsForUser(user);
  const classrooms = await getUserClassrooms(user);

  if (user.role === "student" && classrooms.length) {
    const classroomIds = classrooms.map((classroom) => classroom._id);
    const assignments = await Assignment.find({
      classroom: { $in: classroomIds },
    }).select("_id classroom").lean();
    const submissions = await Submission.find({
      student: user._id,
      assignment: { $in: assignments.map((assignment) => assignment._id) },
    }).select("assignment").lean();
    const submittedAssignmentIds = new Set(
      submissions.map((submission) => String(submission.assignment)),
    );
    const pendingByClassroomId = new Map();

    assignments.forEach((assignment) => {
      if (submittedAssignmentIds.has(String(assignment._id))) {
        return;
      }

      const classroomId = String(assignment.classroom);
      pendingByClassroomId.set(classroomId, (pendingByClassroomId.get(classroomId) || 0) + 1);
    });

    classrooms.forEach((classroom) => {
      classroom.pendingAssignmentCount = pendingByClassroomId.get(String(classroom._id)) || 0;
    });
  }

  const matchedActiveClassroom = classrooms.find(
    (classroom) => String(classroom._id) === String(user.activeClassroom || ""),
  ) || null;
  const activeClassroom = user.role === "teacher"
    ? (matchedActiveClassroom || classrooms[0] || null)
    : matchedActiveClassroom;

  if (String(user.activeClassroom || "") !== String(activeClassroom?._id || "")) {
    user.activeClassroom = activeClassroom?._id || null;
    await user.save();
  }

  return {
    classrooms,
    activeClassroom,
  };
}

export async function requireActiveClassroom(user) {
  const { classrooms, activeClassroom } = await syncActiveClassroom(user);

  if (!activeClassroom) {
    const error = new Error(
      user.role === "teacher"
        ? "Create a classroom first to start publishing assignments."
        : "Join a classroom first to access assignments.",
    );
    error.statusCode = 409;
    error.code = "ACTIVE_CLASSROOM_REQUIRED";
    error.classrooms = classrooms.map(serializeClassroom);
    throw error;
  }

  return {
    classrooms,
    activeClassroom,
  };
}

export function ensureClassroomOwnership(user, classroom) {
  if (user.role !== "teacher" || String(classroom.teacher?._id || classroom.teacher) !== String(user._id)) {
    const error = new Error("You are not allowed to manage this classroom.");
    error.statusCode = 403;
    throw error;
  }
}

export function ensureStudentMembership(user, classroom) {
  const isMember = Array.isArray(classroom.students)
    && classroom.students.some((student) => String(student._id || student) === String(user._id));

  if (user.role !== "student" || !isMember) {
    const error = new Error("You are not enrolled in this classroom.");
    error.statusCode = 403;
    throw error;
  }
}
