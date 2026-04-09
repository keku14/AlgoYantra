import express from "express";

import {
  createLesson,
  getLessonById,
  getLessons,
  updateLesson,
} from "../controllers/lessonController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.route("/").get(getLessons).post(authorize("teacher"), createLesson);
router.route("/:lessonId").get(getLessonById).put(authorize("teacher"), updateLesson);

export default router;
