// services/ExaminationService.js
const pool = require("../../../config/db");

class ExaminationService {
  // ---- NEW: fetch the exam_results row -------------------------------------------------
  async getExamResultByExaminationId(examinationId) {
    try {
      const res = await pool.query(
        `SELECT 
           english_score,
           logical_score,
           computerskill_score,
           customerservice_score,
           total_score,
           submitted_at,
           typing_wpm,
           typing_accuracy
         FROM exam_results 
         WHERE examination_id = $1`,
        [examinationId]
      );
      return res.rows[0] || null;
    } catch (error) {
      console.error("Error fetching exam_results:", error);
      throw error;
    }
  }
}

module.exports = new ExaminationService();
