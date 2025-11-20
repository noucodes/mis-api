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
  // Add these methods to your ReportsService class

  // Count all applicants created in a date range (new applicants)
  async getCountByCreatedDate(startDate, endDate) {
    const query = `
    SELECT COUNT(*) as count
    FROM applicants
    WHERE applicant_created::date BETWEEN $1 AND $2
  `;
    const result = await pool.query(query, [startDate, endDate]);
    return parseInt(result.rows[0].count, 10);
  }

  // Count rejected this month (from status history)
  async getRejectedCountThisMonth(startDate, endDate) {
    const query = `
    SELECT COUNT(DISTINCT a.applicant_id) as count
    FROM applicants a
    JOIN applicant_status_history ash ON a.applicant_id = ash.applicant_id
    WHERE ash.status_type = 'Employment'
      AND LOWER(ash.status_value) = 'rejected'
      AND ash.status_created::date BETWEEN $1 AND $2
  `;
    const result = await pool.query(query, [startDate, endDate]);
    return parseInt(result.rows[0].count || 0, 10);
  }

  async getRecentApplicants() {
    const query = `
    SELECT 
      applicant_id,
      first_name,
      last_name,
      application_status,
      employment_status,
      applicant_created
    FROM applicants
    ORDER BY applicant_created DESC
    LIMIT 15
  `;

    try {
      const result = await pool.query(query);

      const applicants = result.rows.map((row) => {
        const fullName =
          `${row.first_name || ""} ${row.last_name || ""}`.trim() ||
          "Unknown Applicant";

        // === YOUR EXACT LOGIC ===
        let displayStatus = "In Review"; // default fallback

        const empStatus = (row.employment_status || "").trim().toLowerCase();

        if (empStatus === "rejected") {
          displayStatus = "Rejected";
        } else if (empStatus === "shortlisted") {
          displayStatus = "Shortlisted";
        } else if (empStatus === "blocklisted") {
          displayStatus = "Blocklisted";
        } else {
          // If not one of the 3 special cases → use application_status
          const appStatus = (row.application_status || "").trim();

          const statusMap = {
            Examination: "Examination",
            "Initial Interview": "Initial Interview",
            "Final Interview": "Final Interview",
            "Job Offer": "Job Offer",
            Hired: "Offer Extended",
          };

          displayStatus = statusMap[appStatus] || "In Review";
        }

        return {
          id: row.applicant_id,
          name: fullName,
          status: displayStatus,
          appliedAgo: row.applicant_created, // formatted on frontend
        };
      });

      return applicants;
    } catch (error) {
      console.error("Error fetching recent applicants:", error);
      throw new Error("Failed to fetch recent applicants");
    }
  }
  // === Applicant Sources (Pie Chart) ===
  async getApplicantSources() {
    const query = `
    SELECT 
      COALESCE(job_source, 'Others') AS source,
      COUNT(*) AS value
    FROM applicants
    WHERE job_source IS NOT NULL AND job_source != ''
    GROUP BY COALESCE(job_source, 'Others')
    ORDER BY value DESC
  `;

    try {
      const result = await pool.query(query);

      // Force "Others" to the end and limit to top 5 (like your static data)
      const topSources = result.rows
        .filter((row) => row.source !== "Others")
        .slice(0, 4);

      const othersCount = result.rows
        .filter((row) => !topSources.some((t) => t.source === row.source))
        .reduce((sum, row) => sum + parseInt(row.value), 0);

      const final = [
        ...topSources.map((row) => ({
          name: row.source,
          value: parseInt(row.value, 10),
        })),
        { name: "Others", value: othersCount || 7 }, // fallback if no others
      ];

      return final;
    } catch (error) {
      console.error("Error fetching applicant sources:", error);
      throw new Error("Failed to fetch sources");
    }
  }

  // === Monthly Hired vs Rejected (Bar Chart) ===
  async getMonthlyHiredVsRejected(year) {
    const query = `
    SELECT 
      TO_CHAR(date_trunc('month', applicant_created), 'Mon') AS month,
      EXTRACT(MONTH FROM date_trunc('month', applicant_created)) AS month_num,
      COUNT(*) FILTER (WHERE employment_status = 'rejected') AS rejected,
      COUNT(*) FILTER (WHERE application_status = 'Hired' OR date_hired IS NOT NULL) AS hired
    FROM applicants
    WHERE EXTRACT(YEAR FROM applicant_created) = $1
    GROUP BY date_trunc('month', applicant_created)
    ORDER BY month_num
  `;

    try {
      const result = await pool.query(query, [year]);

      // Ensure all 12 months exist (fill missing with 0)
      const monthsOrder = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const data = monthsOrder.map((month) => {
        const found = result.rows.find((r) => r.month === month);
        return {
          month,
          hired: found ? parseInt(found.hired || 0) : 0,
          rejected: found ? parseInt(found.rejected || 0) : 0,
        };
      });

      return data;
    } catch (error) {
      console.error("Error fetching monthly stats:", error);
      throw new Error("Failed to fetch monthly data");
    }
  }
}

module.exports = new ReportsService();
