const pool = require("../../../config/db");

class ExaminationService {
  // ✅ Get examination data for an applicant (combines all phases)
  async getExaminationByExaminationId(examinationId) {
    try {
      const [phaseOneRes, phaseTwoRes, phaseThreeRes, phaseFourRes] =
        await Promise.all([
          pool.query(
            "SELECT * FROM phaseone_results WHERE examination_code = $1",
            [examinationId]
          ),
          pool.query(
            "SELECT * FROM phasetwo_results WHERE examination_code = $1",
            [examinationId]
          ),
          pool.query(
            "SELECT * FROM phasethree_results WHERE examination_code = $1",
            [examinationId]
          ),
          pool.query(
            "SELECT * FROM phasefour_results WHERE examination_code = $1",
            [examinationId]
          ),
        ]);

      return {
        phaseOneResult: phaseOneRes.rows[0]?.result || null,
        phaseTwoResult: phaseTwoRes.rows[0]?.result || null,
        phaseThreeWpm: phaseThreeRes.rows[0]?.wpm || null,
        phaseThreeImageUrl: phaseThreeRes.rows[0]?.image_url || null,
        phaseFourFileUrl: phaseFourRes.rows[0]?.file_url || null,
      };
    } catch (error) {
      console.error("Error fetching examination data:", error);
      throw error;
    }
  }

  // ✅ Create Phase One result
  async createPhaseOneResult(examinationId, result) {
    try {
      const res = await pool.query(
        "INSERT INTO phaseone_results (examination_code, result) VALUES ($1, $2) RETURNING *",
        [examinationId, result]
      );
      return res.rows[0];
    } catch (error) {
      console.error("Error creating Phase One result:", error);
      throw error;
    }
  }

  // ✅ Update Phase One result
  async updatePhaseOneResult(examinationId, result) {
    try {
      const res = await pool.query(
        "UPDATE phaseone_results SET result = $1 WHERE examination_code = $2 RETURNING *",
        [result, examinationId]
      );
      return res.rows[0];
    } catch (error) {
      console.error("Error updating Phase One result:", error);
      throw error;
    }
  }

  // ✅ Create Phase Two result
  async createPhaseTwoResult(examinationId, result) {
    try {
      const res = await pool.query(
        "INSERT INTO phasetwo_results (examination_code, result) VALUES ($1, $2) RETURNING *",
        [examinationId, result]
      );
      return res.rows[0];
    } catch (error) {
      console.error("Error creating Phase Two result:", error);
      throw error;
    }
  }

  // ✅ Update Phase Two result
  async updatePhaseTwoResult(examinationId, result) {
    try {
      const res = await pool.query(
        "UPDATE phasetwo_results SET result = $1 WHERE examination_code = $2 RETURNING *",
        [result, examinationId]
      );
      return res.rows[0];
    } catch (error) {
      console.error("Error updating Phase Two result:", error);
      throw error;
    }
  }

  // ✅ Create Phase Three result
  async createPhaseThreeResult(examinationId, { wpm, image_url }) {
    try {
      const res = await pool.query(
        "INSERT INTO phasethree_results (examination_code, wpm, image_url) VALUES ($1, $2, $3) RETURNING *",
        [examinationId, wpm, image_url]
      );
      return res.rows[0];
    } catch (error) {
      console.error("Error creating Phase Three result:", error);
      throw error;
    }
  }

  // ✅ Update Phase Three result
  async updatePhaseThreeResult(examinationId, { wpm, image_url }) {
    try {
      const res = await pool.query(
        `UPDATE phasethree_results 
         SET wpm = COALESCE($1, wpm),
             image_url = COALESCE($2, image_url)
         WHERE examination_code = $3
         RETURNING *`,
        [wpm, image_url, examinationId]
      );
      return res.rows[0];
    } catch (error) {
      console.error("Error updating Phase Three result:", error);
      throw error;
    }
  }

  // ✅ Create Phase Four result
  async createPhaseFourResult(examinationId, file_url) {
    try {
      const res = await pool.query(
        "INSERT INTO phasefour_results (examination_code, file_url) VALUES ($1, $2) RETURNING *",
        [examinationId, file_url]
      );
      return res.rows[0];
    } catch (error) {
      console.error("Error creating Phase Four result:", error);
      throw error;
    }
  }

  // ✅ Update Phase Four result
  async updatePhaseFourResult(examinationId, file_url) {
    try {
      const res = await pool.query(
        "UPDATE phasefour_results SET file_url = $1 WHERE examination_code = $2 RETURNING *",
        [file_url, examinationId]
      );
      return res.rows[0];
    } catch (error) {
      console.error("Error updating Phase Four result:", error);
      throw error;
    }
  }

  // ✅ Delete all examination results for an applicant (if needed)
  async deleteExaminationByExaminationId(examinationId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "DELETE FROM phaseone_results WHERE examination_code = $1",
        [examinationId]
      );
      await client.query(
        "DELETE FROM phasetwo_results WHERE examination_code = $1",
        [examinationId]
      );
      await client.query(
        "DELETE FROM phasethree_results WHERE examination_code = $1",
        [examinationId]
      );
      await client.query(
        "DELETE FROM phasefour_results WHERE examination_code = $1",
        [examinationId]
      );
      await client.query("COMMIT");
      return { message: "Examination results deleted successfully" };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error deleting examination results:", error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new ExaminationService();
