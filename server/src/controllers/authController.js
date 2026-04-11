import Performance from "../models/Performance.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { serializeClassroom, syncActiveClassroom } from "../utils/classroom.js";
import { generateToken } from "../utils/token.js";

function sanitizeUser(user) {
  const object = user.toObject ? user.toObject() : user;
  delete object.password;
  return object;
}

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    const error = new Error("Name, email, password, and role are required.");
    error.statusCode = 400;
    throw error;
  }

  if (!["teacher", "student"].includes(role)) {
    const error = new Error("Role must be either teacher or student.");
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    const error = new Error("An account with that email already exists.");
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  if (role === "student") {
    await Performance.create({
      student: user._id,
      history: [],
      progress: [],
    });
  }

  res.status(201).json({
    token: generateToken(user),
    user: sanitizeUser(user),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    const error = new Error("Email and password are required.");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    const error = new Error("Invalid credentials.");
    error.statusCode = 401;
    throw error;
  }

  if (role && user.role !== role) {
    const error = new Error(`This account is registered as a ${user.role}.`);
    error.statusCode = 401;
    throw error;
  }

  if (user.role === "teacher") {
    user.activeClassroom = null;
  }

  user.lastActiveAt = new Date();
  await user.save();

  res.status(200).json({
    token: generateToken(user),
    user: sanitizeUser(user),
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const { classrooms, activeClassroom } = await syncActiveClassroom(req.user);
  const performance =
    req.user.role === "student"
      ? await Performance.findOne({ student: req.user._id })
      : null;

  res.status(200).json({
    user: req.user,
    performance,
    classrooms: classrooms.map(serializeClassroom),
    activeClassroom: serializeClassroom(activeClassroom),
  });
});
