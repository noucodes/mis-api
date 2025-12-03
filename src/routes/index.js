const express = require("express");
const router = express.Router();
const userRoutes = require("../modules/users/routes/user.routes");
const personalInfoRoutes = require("../modules/personal_info/routes/personalInfo.routes");
const employeeDetailsRoutes = require("../modules/employee_details/routes/employeeDetails.route");
const applicantsRoutes = require("../modules/applicants/routes/applicants.route");
const applicantsStatusRoutes = require("../modules/applicants/routes/status.route");
const onboardingRoutes = require("../modules/applicants/routes/onboarding.route");
const reportsRoutes = require("../modules/applicants/routes/reports.route");
const examinationRoutes = require("../modules/applicants/routes/examination.route");

// Attendance routes (HR/Admin - all employees)
const attendanceRoutes = require("../modules/attendance/route/user.route");
const attendanceHistoryRoutes = require("../modules/attendance/route/user.history");

// Employee-specific attendance routes (Individual user)
const employeeAttendanceRoutes = require("../modules/employee/attendance/user.attendance");

const authMiddleware = require("../middlewares/auth");
const logger = require("../middlewares/logging");

router.use(logger);

// Mount users info routes
router.use("/users", userRoutes);

// Mount personal info routes
router.use("/personal-info", personalInfoRoutes);

// Mount employee details routes
router.use("/employee-details", employeeDetailsRoutes);

// Mount applicants routes
router.use("/applicants", applicantsRoutes);

// Mount applicants status routes
router.use("/status", applicantsStatusRoutes);

// Mount onboarding routes
router.use("/onboarding", onboardingRoutes);

// Mount reports routes
router.use("/reports", reportsRoutes);

// Mount examination routes
router.use("/examination", examinationRoutes);

// Mount HR/Admin attendance routes (all employees)
router.use("/attendance", attendanceRoutes);
router.use("/attendance/history", attendanceHistoryRoutes);

// Mount employee-specific attendance route (protected, individual user only)
router.use("/employee/attendance", authMiddleware, employeeAttendanceRoutes);

// Protected dashboard route
router.get("/dashboard", authMiddleware, (req, res) => {
  try {
    res.json({ message: `Welcome to your dashboard, ${req.user.email}` });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Protected user info route
router.get("/me", authMiddleware, (req, res) => {
  res.json({
    id: req.user.id,
    employeeId: req.user.employeeId,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
});

module.exports = router;