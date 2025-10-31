const express = require("express");
const router = express.Router();
const examinationController = require("../controllers/examination.controller");
const authMiddleware = require("../../../middlewares/auth");

// Get examination results by applicant ID
router.get(
  "/:applicantId",
  authMiddleware,
  examinationController.getExaminationByApplicantId
);

// Create Phase One result
router.post(
  "/:applicantId/phase-one",
  authMiddleware,
  examinationController.createPhaseOneResult
);

// Update Phase One result
router.put(
  "/:applicantId/phase-one",
  authMiddleware,
  examinationController.updatePhaseOneResult
);

// Create Phase Two result
router.post(
  "/:applicantId/phase-two",
  authMiddleware,
  examinationController.createPhaseTwoResult
);

// Update Phase Two result
router.put(
  "/:applicantId/phase-two",
  authMiddleware,
  examinationController.updatePhaseTwoResult
);

// Create Phase Three result
router.post(
  "/:applicantId/phase-three",
  authMiddleware,
  examinationController.createPhaseThreeResult
);

// Update Phase Three result
router.put(
  "/:applicantId/phase-three",
  authMiddleware,
  examinationController.updatePhaseThreeResult
);

// Create Phase Four result
router.post(
  "/:applicantId/phase-four",
  authMiddleware,
  examinationController.createPhaseFourResult
);

// Update Phase Four result
router.put(
  "/:applicantId/phase-four",
  authMiddleware,
  examinationController.updatePhaseFourResult
);

// Delete all examination results for an applicant
router.delete(
  "/:applicantId",
  authMiddleware,
  examinationController.deleteExaminationByApplicantId
);

module.exports = router;
