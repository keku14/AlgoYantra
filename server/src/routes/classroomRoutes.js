import express from "express";

import {
  createClassroom,
  clearActiveClassroom,
  deleteClassroom,
  getClassroomRoster,
  getMyClassrooms,
  joinClassroom,
  leaveClassroom,
  setActiveClassroom,
  updateClassroom,
} from "../controllers/classroomController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/", getMyClassrooms);
router.post("/", authorize("teacher"), createClassroom);
router.post("/join", authorize("student"), joinClassroom);
router.delete("/:classroomId/leave", authorize("student"), leaveClassroom);
router.patch("/active/clear", clearActiveClassroom);
router.patch("/:classroomId/active", setActiveClassroom);
router.put("/:classroomId", authorize("teacher"), updateClassroom);
router.delete("/:classroomId", authorize("teacher"), deleteClassroom);
router.get("/:classroomId/roster", authorize("teacher"), getClassroomRoster);

export default router;
