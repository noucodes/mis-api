const pool = require("../../../config/db");

class ExaminationService {
  // ✅ Get examination data for an applicant (combines all phases)
  async getExaminationByApplicantId(applicantId) {
    try {
      const [phaseOneRes, phaseTwoRes, phaseThreeRes, phaseFourRes] =
        await Promise.all([
          pool.query("SELECT * FROM phaseone_results WHERE applicant_id = $1", [
            applicantId,
          ]),
          pool.query("SELECT * FROM phasetwo_results WHERE applicant_id = $1", [
            applicantId,
          ]),
          pool.query(
            "SELECT * FROM phasethree_results WHERE applicant_id = $1",
            [applicantId]
          ),
          pool.query(
            "SELECT * FROM phasefour_results WHERE applicant_id = $1",
            [applicantId]
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
  async createPhaseOneResult(applicantId, result) {
    try {
      const res = await pool.query(
        "INSERT INTO phaseone_results (applicant_id, result) VALUES ($1, $2) RETURNING *",
        [applicantId, result]
      );
      return res.rows[0];
    } catch (error) {
      console.error("Error creating Phase One result:", error);
      throw error;
    }
  }

  // ✅ Update Phase One result
  async updatePhaseOneResult(applicantId, result) {
    try {
      const res = await pool.query(
        "UPDATE phaseone_results SET result = $1 WHERE applicant_id = $2 RETURNING *",
        [result, applicantId]
      );
      return res.rows[0];
    } catch (error) {
      console.error("Error updating Phase One result:", error);
      throw error;
    }
  }

  // ✅ Create Phase Two result
  async createPhaseTwoResult(applicantId, result) {
    try {
      const res = await pool.query(
        "INSERT INTO phasetwo_results (applicant_id, result) VALUES ($1, $2) RETURNING *",
        [applicantId, result]
      );
      return res.rows[0];
    } catch (error) {
      console.error("Error creating Phase Two result:", error);
      throw error;
    }
  }

  // ✅ Update Phase Two result
  async updatePhaseTwoResult(applicantId, result) {
    try {
      const res = await pool.query(
        "UPDATE phasetwo_results SET result = $1 WHERE applicant_id = $2 RETURNING *",
        [result, applicantId]
      );
      return res.rows[0];
    } catch (error) {
      console.error("Error updating Phase Two result:", error);
      throw error;
    }
  }

  // ✅ Create Phase Three result
  async createPhaseThreeResult(applicantId, { wpm, image_url }) {
    try {
      const res = await pool.query(
        "INSERT INTO phasethree_results (applicant_id, wpm, image_url) VALUES ($1, $2, $3) RETURNING *",
        [applicantId, wpm, image_url]
      );
      return res.rows[0];
    } catch (error) {
      console.error("Error creating Phase Three result:", error);
      throw error;
    }
  }

  // ✅ Update Phase Three result
  async updatePhaseThreeResult(applicantId, { wpm, image_url }) {
    try {
      const res = await pool.query(
        `UPDATE phasethree_results 
         SET wpm = COALESCE($1, wpm),
             image_url = COALESCE($2, image_url)
         WHERE applicant_id = $3
         RETURNING *`,
        [wpm, image_url, applicantId]
      );
      return res.rows[0];
    } catch (error) {
      console.error("Error updating Phase Three result:", error);
      throw error;
    }
  }

  // ✅ Create Phase Four result
  async createPhaseFourResult(applicantId, file_url) {
    try {
      const res = await pool.query(
        "INSERT INTO phasefour_results (applicant_id, file_url) VALUES ($1, $2) RETURNING *",
        [applicantId, file_url]
      );
      return res.rows[0];
    } catch (error) {
      console.error("Error creating Phase Four result:", error);
      throw error;
    }
  }

  // ✅ Update Phase Four result
  async updatePhaseFourResult(applicantId, file_url) {
    try {
      const res = await pool.query(
        "UPDATE phasefour_results SET file_url = $1 WHERE applicant_id = $2 RETURNING *",
        [file_url, applicantId]
      );
      return res.rows[0];
    } catch (error) {
      console.error("Error updating Phase Four result:", error);
      throw error;
    }
  }

  // ✅ Delete all examination results for an applicant (if needed)
  async deleteExaminationByApplicantId(applicantId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "DELETE FROM phaseone_results WHERE applicant_id = $1",
        [applicantId]
      );
      await client.query(
        "DELETE FROM phasetwo_results WHERE applicant_id = $1",
        [applicantId]
      );
      await client.query(
        "DELETE FROM phasethree_results WHERE applicant_id = $1",
        [applicantId]
      );
      await client.query(
        "DELETE FROM phasefour_results WHERE applicant_id = $1",
        [applicantId]
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
