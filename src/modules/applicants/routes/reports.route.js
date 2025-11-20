// routes/reports.js
const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reports.controller");

router.get("/dashboard-metrics", reportsController.getDashboardMetrics);
// Just add this line with your other routes
router.get("/recent-applicants", reportsController.getRecentApplicants);
router.get("/applicant-sources", reportsController.getApplicantSources);
router.get(
  "/monthly-hired-rejected",
  reportsController.getMonthlyHiredVsRejected
);

module.exports = router;
