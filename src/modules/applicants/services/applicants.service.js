const pool = require("../../../config/db");
const OnboardingService = require("./onboarding.service"); // ✅ make sure path is correct

class ApplicantsService {
  // Generate a unique examination code (AD-XXXXXX)
  async generateUniqueExamCode() {
    let code;
    let exists = true;
    while (exists) {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      code = `AD-${randomNum}`;
      const { rows } = await pool.query(
        "SELECT 1 FROM applicants WHERE examination_code = $1 LIMIT 1",
        [code]
      );
      exists = rows.length > 0;
    }
    return code;
  }

  // ✅ Create a new applicant
  async createApplicant(data) {
    try {
      const {
        first_name,
        last_name,
        position_applied,
        application_status = "Applied",
        employment_status = "Applicant",
        resume_url,
        referrer,
        email,
        phone,
        employment_location,
        job_source,
      } = data;

      const examination_code = await this.generateUniqueExamCode();

      const result = await pool.query(
        `INSERT INTO applicants 
           (first_name, last_name, position_applied, application_status, employment_status, examination_code, resume_url, referrer, email, phone, employment_location, job_source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          first_name,
          last_name,
          position_applied,
          application_status,
          employment_status,
          examination_code,
          resume_url,
          referrer,
          email,
          phone,
          employment_location,
          job_source,
        ]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Error in service creating applicant:", error);
      throw error;
    }
  }

  // ✅ Get all applicants
  async getAllApplicants() {
    try {
      const result = await pool.query(
        "SELECT * FROM applicants ORDER BY applicant_id DESC"
      );
      return result.rows;
    } catch (error) {
      console.error("Error in service fetching applicants:", error);
      throw error;
    }
  }

  // ✅ Get all applicants by status
  async getAllApplicantsByStatus(status) {
    try {
      const result = await pool.query(
        "SELECT * FROM applicants WHERE employment_status = $1 ORDER BY applicant_id DESC",
        [status]
      );
      return result.rows;
    } catch (error) {
      console.error("Error in service fetching applicants:", error);
      throw error;
    }
  }

  // ✅ Get single applicant by ID
  async getApplicantById(id) {
    try {
      const result = await pool.query(
        "SELECT * FROM applicants WHERE applicant_id = $1",
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error in service fetching applicant by id:", error);
      throw error;
    }
  }

  // ✅ Update applicant & handle onboarding transition
  async updateApplicant(id, data) {
    const client = await pool.connect();
    try {
      let {
        first_name,
        last_name,
        position_applied,
        application_status,
        employment_status,
        comment,
        updated_by,
        updated_by_role,
        new_status,
        examination_date,
        final_interview_date,
      } = data;

      // Set employment_status to "Onboarding" if new_status is "Hired"
      if (new_status === "Hired") {
        employment_status = "Onboarding";
      }

      await client.query("BEGIN");

      // 🔹 Update applicant record
      const result = await client.query(
        `UPDATE applicants
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           position_applied = COALESCE($3, position_applied),
           application_status = COALESCE($4, application_status),
           employment_status = COALESCE($5, employment_status),
           examination_date = COALESCE($6, examination_date),
           final_interview_date = COALESCE($7, final_interview_date),
           date_hired = CASE
             WHEN $3 = 'Hired' AND date_hired IS NULL THEN NOW()
             ELSE date_hired
           END
       WHERE applicant_id = $8
       RETURNING *`,
        [
          first_name,
          last_name,
          position_applied,
          new_status || application_status,
          employment_status,
          examination_date,
          final_interview_date,
          id,
        ]
      );

      const updatedApplicant = result.rows[0];

      // 🔹 Fetch examination_code
      const examinationResult = await client.query(
        `SELECT examination_code FROM applicants WHERE applicant_id = $1`,
        [id]
      );
      const examination_code = examinationResult.rows[0]?.examination_code;
      if (!examination_code && new_status === "Examination") {
        throw new Error(`Examination code not found for applicant ID ${id}`);
      }

      // 🔹 Insert into examination_details if new_status is "Examination"
      if (new_status === "Examination") {
        await client.query(
          `INSERT INTO examini_details (examination_id) VALUES($1)`,
          [examination_code]
        );
      }

      // 🔹 Log history if status updated
      if (application_status || employment_status) {
        await client.query(
          `INSERT INTO applicant_status_history
           (applicant_id, status_type, status_value, comment, updated_by, updated_by_role)
         VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            id,
            employment_status ? "Employment" : "Application",
            employment_status || application_status,
            comment || null,
            updated_by || "System",
            updated_by_role || "System Administrator",
          ]
        );
      }

      await client.query("COMMIT");

      // 🔹 Initialize onboarding tasks if newly onboarded
      if (employment_status === "Onboarding") {
        await OnboardingService.initializeApplicantTasks(id);
      }

      return updatedApplicant;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error updating applicant:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ✅ Delete applicant
  async deleteApplicant(id) {
    try {
      const result = await pool.query(
        "DELETE FROM applicants WHERE applicant_id = $1 RETURNING *",
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error in service deleting applicant:", error);
      throw error;
    }
  }

  async getRecentApplicants() {
    try {
      const result = await pool.query(
        `
      SELECT *
      FROM applicants
      ORDER BY applicant_created DESC
    `
      );
      console.log("Recent applicants:", result.rows);
      return result.rows;
    } catch (error) {
      console.error("Error fetching recent applicants:", error);
      throw new Error("Failed to fetch recent applicants");
    }
  }
}

module.exports = new ApplicantsService();
