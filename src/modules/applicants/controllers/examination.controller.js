const ExaminationService = require("../services/examination.service");

// Get exam_results by examination_id (the string you already have)
exports.getExamResultByExaminationId = async (req, res) => {
  try {
    const { examinationId } = req.params;

    if (!examinationId) {
      return res.status(400).json({ message: "Missing examinationId" });
    }

    const result = await ExaminationService.getExamResultByExaminationId(
      examinationId
    );

    if (!result) {
      return res.status(404).json({ message: "Exam result not found" });
    }

    res.json(result);
  } catch (error) {
    console.error("Error fetching exam result:", error);
    res.status(500).json({ message: error.message });
  }
};
