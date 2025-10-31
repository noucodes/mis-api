const pool = require("../../../config/db");

class StatusService {
  // Create new status entry (when applicant moves to a new column in Kanban)
  async createStatus(applicantId, status, statusSchedule = null) {
    try {
      const result = await pool.query(
        `INSERT INTO applicant_status_history (applicant_id, status, status_schedule)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [applicantId, status, statusSchedule]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Error in service creating status:", error);
      throw error;
    }
  }

  // Get full status history for a specific applicant
  async getStatusHistoryByApplicant(applicantId) {
    try {
      const result = await pool.query(
        `SELECT *
         FROM applicant_status_history
         WHERE applicant_id = $1
         ORDER BY status_updated DESC`,
        [applicantId]
      );

      return result.rows;
    } catch (error) {
      console.error("Error in service fetching status history:", error);
      throw error;
    }
  }

  // Get all status history records (for admin overview, if needed)
  async getAllStatuses() {
    try {
      const result = await pool.query(
        `SELECT * FROM applicant_status_history ORDER BY status_id DESC`
      );
      return result.rows;
    } catch (error) {
      console.error("Error in service fetching all statuses:", error);
      throw error;
    }
  }

  // Get the latest status for an applicant
  async getLatestStatus(applicantId) {
    try {
      const result = await pool.query(
        `SELECT *
         FROM applicant_status_history
         WHERE applicant_id = $1
         ORDER BY status_updated DESC
         LIMIT 1`,
        [applicantId]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Error in service fetching latest status:", error);
      throw error;
    }
  }

  // Update a status entry (optional – usually you insert new rows instead of updating history)
  async updateStatus(id, status, statusSchedule = null) {
    try {
      const result = await pool.query(
        `UPDATE applicant_status_history
         SET status = $1,
             status_schedule = $2,
             status_updated = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [status, statusSchedule, id]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Error in service updating status:", error);
      throw error;
    }
  }

  // Delete a status entry
  async deleteStatus(id) {
    try {
      const result = await pool.query(
        "DELETE FROM applicant_status_history WHERE id = $1 RETURNING *",
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error in service deleting status:", error);
      throw error;
    }
  }
}

module.exports = new StatusService();
