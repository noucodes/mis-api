// services/ReportsService.js
const pool = require("../../../config/db");
const { startOfMonth, endOfMonth, subMonths, format } = require("date-fns");

class ReportsService {
  // Get applicant counts by status for a date range
  async getApplicantCountsByStatus(startDate, endDate) {
    // Ensure dates are in UTC and formatted as YYYY-MM-DD HH:mm:ss
    const start = format(new Date(startDate), "yyyy-MM-dd 00:00:00");
    const end = format(new Date(endDate), "yyyy-MM-dd 23:59:59");

    const query = `
      SELECT employment_status, COUNT(*) as count
      FROM applicants
      WHERE applicant_created BETWEEN $1 AND $2
      GROUP BY employment_status
    `;
    try {
      const result = await pool.query(query, [start, end]);
      // Log result for debugging
      console.log("Applicant counts:", result.rows);
      return result.rows;
    } catch (error) {
      console.error("Error fetching applicant counts by status:", error);
      throw new Error("Failed to fetch applicant counts");
    }
  }

  // Get monthly conversion rate and counts
  async getMonthlyConversionRate(startDate, endDate) {
    const start = format(new Date(startDate), "yyyy-MM-dd 00:00:00");
    const end = format(new Date(endDate), "yyyy-MM-dd 23:59:59");

    const query = `
      WITH hired AS (
        SELECT COUNT(*) as hired_count 
        FROM applicants 
        WHERE application_status = 'Hired' 
          AND applicant_created BETWEEN $1 AND $2
      ), total AS (
        SELECT COUNT(*) as total_count 
        FROM applicants 
        WHERE applicant_created BETWEEN $1 AND $2
      )
      SELECT 
        hired.hired_count,
        total.total_count,
        (hired.hired_count::float / NULLIF(total.total_count, 0)) * 100 as conversion_rate
      FROM hired, total
    `;
    try {
      const result = await pool.query(query, [start, end]);
      // Log result for debugging
      console.log("Conversion rate:", result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error("Error fetching monthly conversion rate:", error);
      throw new Error("Failed to fetch conversion rate");
    }
  }

  // Get total applicants (all time)
  async getTotalApplicantsCount() {
    const query = `
      SELECT COUNT(*) as total_applicants
      FROM applicants
    `;
    try {
      const result = await pool.query(query);
      // Log result for debugging
      console.log("Total applicants:", result.rows[0].total_applicants);
      return parseInt(result.rows[0].total_applicants, 10);
    } catch (error) {
      console.error("Error fetching total applicants count:", error);
      throw new Error("Failed to fetch total applicants");
    }
  }

  // Get percentage change from previous month for a given status
  async getStatusChangeFromLastMonth(status, startDate, endDate) {
    const start = format(new Date(startDate), "yyyy-MM-dd 00:00:00");
    const end = format(new Date(endDate), "yyyy-MM-dd 23:59:59");
    const prevStartDate = format(
      subMonths(new Date(startDate), 1),
      "yyyy-MM-dd 00:00:00"
    );
    const prevEndDate = format(
      subMonths(new Date(endDate), 1),
      "yyyy-MM-dd 23:59:59"
    );

    const query = `
      SELECT 
        (SELECT COUNT(*) FROM applicants WHERE employment_status = $1 AND applicant_created BETWEEN $2 AND $3) as current_count,
        (SELECT COUNT(*) FROM applicants WHERE employment_status = $1 AND applicant_created BETWEEN $4 AND $5) as prev_count
    `;
    try {
      const result = await pool.query(query, [
        status,
        start,
        end,
        prevStartDate,
        prevEndDate,
      ]);
      const { current_count, prev_count } = result.rows[0];
      // Log counts for debugging
      console.log(
        `Status ${status} - Current: ${current_count}, Previous: ${prev_count}`
      );
      if (prev_count == 0) return current_count > 0 ? 100 : 0;
      return (((current_count - prev_count) / prev_count) * 100).toFixed(2);
    } catch (error) {
      console.error(
        `Error calculating ${status} change from last month:`,
        error
      );
      throw new Error(`Failed to calculate ${status} change`);
    }
  }

  async getApplicantsByStatusMonthly(startDate, endDate) {
    const start = format(new Date(startDate), "yyyy-MM-dd 00:00:00");
    const end = format(new Date(endDate), "yyyy-MM-dd 23:59:59");

    const query = `
    SELECT 
      TO_CHAR(COALESCE(h.date_hired, r.status_created), 'Mon') AS name,
      COALESCE(COUNT(h.applicant_id), 0) AS hired,
      COALESCE(COUNT(r.applicant_id), 0) AS rejected
    FROM (
      SELECT applicant_id, date_hired
      FROM applicants
      WHERE LOWER(application_status) = 'hired'
        AND date_hired BETWEEN $1 AND $2
    ) h
    FULL OUTER JOIN (
      SELECT a.applicant_id, ash.status_created
      FROM applicants a
      JOIN applicant_status_history ash
        ON a.applicant_id = ash.applicant_id
      WHERE ash.status_type = 'Employment'
        AND LOWER(ash.status_value) = 'rejected'
        AND ash.status_created BETWEEN $1 AND $2
    ) r
      ON TO_CHAR(h.date_hired, 'Mon') = TO_CHAR(r.status_created, 'Mon')
    GROUP BY TO_CHAR(COALESCE(h.date_hired, r.status_created), 'Mon'), EXTRACT(MONTH FROM COALESCE(h.date_hired, r.status_created))
    ORDER BY EXTRACT(MONTH FROM COALESCE(h.date_hired, r.status_created))
    `;
    try {
      const result = await pool.query(query, [start, end]);
      console.log("Monthly applicant counts:", result.rows);
      return result.rows;
    } catch (error) {
      console.error("Error fetching monthly applicant counts:", error);
      throw new Error("Failed to fetch monthly applicant counts");
    }
  }
}

module.exports = new ReportsService();
