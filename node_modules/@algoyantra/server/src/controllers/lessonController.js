import { simulateOperations } from "@algoyantra/shared";

import Lesson from "../models/Lesson.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getLessons = asyncHandler(async (req, res) => {
  const filters = {};

  if (req.query.type) {
    filters.type = req.query.type;
  }

  if (req.user.role === "student") {
    filters.published = true;
  }

  const lessons = await Lesson.find(filters)
    .populate("teacher", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    lessons,
  });
});

export const getLessonById = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.lessonId).populate("teacher", "name email");

  if (!lesson) {
    const error = new Error("Lesson not found.");
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    lesson,
  });
});

export const createLesson = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    teacher: req.user._id,
  };

  if (!payload.visualizationData && Array.isArray(payload.operations)) {
    payload.visualizationData = simulateOperations({
      treeType: payload.type,
      initialTree: payload.initialTree || null,
      operations: payload.operations,
    });
  }

  const lesson = await Lesson.create(payload);

  res.status(201).json({
    lesson,
  });
});

export const updateLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.lessonId);

  if (!lesson) {
    const error = new Error("Lesson not found.");
    error.statusCode = 404;
    throw error;
  }

  if (String(lesson.teacher) !== String(req.user._id)) {
    const error = new Error("You can only update your own lessons.");
    error.statusCode = 403;
    throw error;
  }

  Object.assign(lesson, req.body);

  if (!lesson.visualizationData && Array.isArray(lesson.operations)) {
    lesson.visualizationData = simulateOperations({
      treeType: lesson.type,
      initialTree: lesson.initialTree || null,
      operations: lesson.operations,
    });
  }

  await lesson.save();

  res.status(200).json({
    lesson,
  });
});
