const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reports.controller");
const authMiddleware = require("../../../middlewares/auth");

// Get dashboard metrics (new applicants, rejected, total applicants, conversion rate)
router.get("/dashboard", authMiddleware, reportsController.getDashboardMetrics);

// Get applicant counts by status for a custom date range
router.get(
  "/applicants-by-status",
  authMiddleware,
  reportsController.getApplicantCountsByStatus
);

// Get monthly conversion rate for a custom date range
router.get(
  "/conversion-rate",
  authMiddleware,
  reportsController.getMonthlyConversionRate
);

// Get total applicants count
router.get(
  "/total-applicants",
  authMiddleware,
  reportsController.getTotalApplicantsCount
);

// Get percentage change for a specific status compared to previous month
router.get(
  "/status-change",
  authMiddleware,
  reportsController.getStatusChangeFromLastMonth
);

// Get Application By Status
router.get(
  "/applicants-by-status",
  authMiddleware,
  reportsController.getApplicantsByStatusMonthly
);

module.exports = router;
