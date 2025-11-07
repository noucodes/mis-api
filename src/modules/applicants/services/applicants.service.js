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

      const result = await pool.query(
        `INSERT INTO applicants 
           (first_name, last_name, position_applied, application_status, employment_status, resume_url, referrer, email, phone, employment_location, job_source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          first_name,
          last_name,
          position_applied,
          application_status,
          employment_status,
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

  // ✅ Update applicant & handle onboarding + examination code
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

      // Auto-set employment_status when hired
      if (new_status === "Hired") {
        employment_status = "Onboarding";
      }

      await client.query("BEGIN");

      // ------------------------------------------------------------------
      // 1. Generate examination_code ONLY when moving to "Examination"
      // ------------------------------------------------------------------
      let examination_code = null;
      if (new_status === "Examination") {
        examination_code = await this.generateUniqueExamCode();
        if (!examination_code) {
          throw new Error(
            `Failed to generate examination code for applicant ${id}`
          );
        }
      }

      // ------------------------------------------------------------------
      // 2. Update applicants table (including examination_code if generated)
      // ------------------------------------------------------------------
      const updateQuery = `
      UPDATE applicants
      SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        position_applied = COALESCE($3, position_applied),
        application_status = COALESCE($4, application_status),
        employment_status = COALESCE($5, employment_status),
        examination_code = COALESCE($6, examination_code),   -- ← NEW
        examination_date = COALESCE($7, examination_date),
        final_interview_date = COALESCE($8, final_interview_date),
        date_hired = CASE
          WHEN $4 = 'Hired' AND date_hired IS NULL THEN NOW()
          ELSE date_hired
        END
      WHERE applicant_id = $9
      RETURNING *;
    `;

      const updateValues = [
        first_name,
        last_name,
        position_applied,
        new_status || application_status,
        employment_status,
        examination_code, // ← will be NULL if not Examination
        examination_date,
        final_interview_date,
        id,
      ];

      const result = await client.query(updateQuery, updateValues);
      const updatedApplicant = result.rows[0];

      // ------------------------------------------------------------------
      // 3. Insert into examination_details (fixed table name typo)
      // ------------------------------------------------------------------
      if (new_status === "Examination" && examination_code) {
        await client.query(
          `INSERT INTO examini_details (examination_id) VALUES ($1)
         ON CONFLICT (examination_id) DO NOTHING`, // safe if already exists
          [examination_code]
        );
      }

      // ------------------------------------------------------------------
      // 4. Log status history
      // ------------------------------------------------------------------
      const statusChanged = application_status || employment_status;
      if (statusChanged) {
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

      // ------------------------------------------------------------------
      // 5. Initialize onboarding tasks (if needed)
      // ------------------------------------------------------------------
      if (employment_status === "Onboarding") {
        await OnboardingService.initializeApplicantTasks(id);
      }

      return updatedApplicant; // ← now includes examination_code
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
