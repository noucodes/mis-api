const express = require("express");
const router = express.Router();
const OnboardingController = require("../controllers/onboarding.controller");
const authMiddleware = require("../../../middlewares/auth");

// Routes
router.get("/", authMiddleware, OnboardingController.getAllApplicants);
router.get(
  "/:id/tasks",
  authMiddleware,
  OnboardingController.getTasksByApplicant
);
router.get("/tasks", authMiddleware, OnboardingController.getTasksMasterlist);
router.patch(
  "/:id/tasks/:taskId",
  authMiddleware,
  OnboardingController.updateTaskStatus
);
router.post(
  "/:id/initialize-tasks",
  authMiddleware,
  OnboardingController.initializeApplicantTasks
);
router.get(
  "/onboarding-records",
  authMiddleware,
  OnboardingController.getAllOnboardingRecords
); // Optional

module.exports = router;
