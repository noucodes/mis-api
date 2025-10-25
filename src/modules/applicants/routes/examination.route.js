const express = require("express");
const router = express.Router();
const applicantsController = require("../controllers/applicants.controller");
const authMiddleware = require("../../../middlewares/auth");

// Create new application (with unique examination code)
router.post("/", authMiddleware, applicantsController.createApplication);

// Get all applications
router.get("/", authMiddleware, applicantsController.getAllApplications);

// Get Recent Applicants
router.get("/recent", authMiddleware, applicantsController.getRecentApplicants);

// Get all applications by status
router.get(
  "/status/:status",
  authMiddleware,
  applicantsController.getAllApplicationsByStatus
);

// Get application by ID
router.get("/:id", authMiddleware, applicantsController.getApplicationById);

// Update application
router.put("/:id", authMiddleware, applicantsController.updateApplication);

// Delete application
router.delete("/:id", authMiddleware, applicantsController.deleteApplication);

module.exports = router;
