const pool = require("../../../config/db");

class OnboardingService {
  // Fetch all applicants
  async getAllApplicants() {
    try {
      const result = await pool.query(
        "SELECT applicant_id, first_name, last_name, email FROM applicants WHERE employment_status = 'Onboarding' ORDER BY applicant_id DESC"
      );
      return result.rows;
    } catch (error) {
      console.error("Error fetching applicants:", error);
      throw error;
    }
  }

  // Fetch tasks for a specific applicant with task name
  async getTasksByApplicant(applicantId) {
    try {
      const result = await pool.query(
        `
      SELECT 
        ao.task_id,
        ot.task_name,
        ao.is_completed,
        ao.status_created,
        ao.status_updated
      FROM applicant_onboarding ao
      INNER JOIN onboarding_tasks ot ON ao.task_id = ot.task_id
      WHERE ao.applicant_id = $1
      ORDER BY ot.task_id;
      `,
        [applicantId]
      );
      return result.rows;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      throw error;
    }
  }

  async getTasksMasterlist() {
    try {
      const result = await pool.query(
        "SELECT task_id, task_name FROM onboarding_tasks"
      );
      return result.rows;
    } catch (error) {
      console.error("Error fetching tasks masterlist:", error);
      throw error;
    }
  }

  // Insert all masterlist tasks for a newly onboarded applicant
  async initializeApplicantTasks(applicantId) {
    try {
      // Insert all tasks that don't yet exist for this applicant
      await pool.query(
        `
      INSERT INTO applicant_onboarding (applicant_id, task_id, is_completed, status_created)
      SELECT $1, ot.task_id, false, CURRENT_TIMESTAMP
      FROM onboarding_tasks ot
      WHERE NOT EXISTS (
        SELECT 1 FROM applicant_onboarding ao
        WHERE ao.applicant_id = $1 AND ao.task_id = ot.task_id
      )
      `,
        [applicantId]
      );

      return {
        success: true,
        message: "Applicant onboarding tasks initialized",
      };
    } catch (error) {
      console.error("Error initializing applicant tasks:", error);
      throw error;
    }
  }

  // Update or create task status in applicant_onboarding
  async updateTaskStatus(data) {
    const { taskId, applicantId, isCompleted = true } = data;
    try {
      const result = await pool.query(
        "INSERT INTO applicant_onboarding (task_id, applicant_id, is_completed) VALUES ($1, $2, $3) ON CONFLICT (task_id, applicant_id) DO UPDATE SET is_completed = $3, status_updated = CURRENT_TIMESTAMP RETURNING *",
        [taskId, applicantId, isCompleted]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error updating task status:", error);
      throw error;
    }
  }

  // Fetch all onboarding records (for debugging or reporting)
  async getAllOnboardingRecords() {
    try {
      const result = await pool.query("SELECT * FROM applicant_onboarding");
      return result.rows;
    } catch (error) {
      console.error("Error fetching onboarding records:", error);
      throw error;
    }
  }
}

module.exports = new OnboardingService();
