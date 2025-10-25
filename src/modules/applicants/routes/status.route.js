const express = require("express");
const router = express.Router();
const statusController = require("../controllers/status.controller");
const authMiddleware = require("../../../middlewares/auth");

// Create new status record
router.post("/", authMiddleware, statusController.createStatus);

// Get all statuses
router.get("/", authMiddleware, statusController.getAllStatuses);

// Get status history for a specific applicant
router.get(
  "/applicant/:applicantId",
  authMiddleware,
  statusController.getStatusHistoryByApplicant
);

// Update a status record
router.put("/:id", authMiddleware, statusController.updateStatus);

// Delete a status record
router.delete("/:id", authMiddleware, statusController.deleteStatus);

module.exports = router;
