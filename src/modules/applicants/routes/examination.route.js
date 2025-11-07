const express = require("express");
const router = express.Router();
const examinationController = require("../controllers/examination.controller");
const authMiddleware = require("../../../middlewares/auth");

// NEW – fetch the exam_results row
router.get(
  "/exam/:examinationId",
  authMiddleware,
  examinationController.getExamResultByExaminationId
);

module.exports = router;
