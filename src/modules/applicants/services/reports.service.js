// services/ReportsService.js
const pool = require("../../../config/db");
const { formatDistanceToNow, subMonths, format } = require("date-fns");

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
  // === Get All KPIs for Selected Year + Month ===
  async getRecruitmentKPIs(year, month) {
    const monthNum = new Date(`${month} 1, ${year}`).getMonth() + 1;
    const startDate = `${year}-${String(monthNum).padStart(2, "0")}-01`;
    const lastDay = new Date(year, monthNum, 0).getDate();
    const endDate = `${year}-${String(monthNum).padStart(2, "0")}-${lastDay}`;

    const query = `
    WITH monthly AS (
      SELECT 
        COUNT(*) AS total_applicants,
        
        COUNT(*) FILTER (WHERE employment_status = 'shortlisted') AS shortlisted,
        COUNT(*) FILTER (WHERE employment_status = 'rejected') AS rejected,
        COUNT(*) FILTER (WHERE employment_status = 'blocklisted') AS blocklisted,
        
        -- Not Qualified: applied but never moved forward
        COUNT(*) FILTER (
          WHERE employment_status IS NULL 
            AND application_status NOT IN ('Initial Interview', 'Examination', 'Final Interview', 'Hired')
        ) AS not_qualified,
        
        -- Hired this month (by date_hired or status)
        COUNT(*) FILTER (
          WHERE (application_status = 'Hired' OR date_hired::date BETWEEN $1 AND $2)
        ) AS hired
      FROM applicants
      WHERE applicant_created::date BETWEEN $1 AND $2
    )
    SELECT 
      total_applicants::int,
      shortlisted::int,
      rejected::int,
      blocklisted::int,
      not_qualified::int,
      hired::int,
      ROUND(
        CASE WHEN total_applicants > 0 
          THEN (shortlisted::decimal / total_applicants) * 100 
          ELSE 0 
        END, 1
      ) AS shortlist_rate
    FROM monthly
  `;

    try {
      const result = await pool.query(query, [startDate, endDate]);
      return result.rows[0]; // single row with all KPIs
    } catch (error) {
      console.error("Error fetching KPIs:", error);
      throw new Error("Failed to fetch recruitment KPIs");
    }
  }

  // === Onboarding Pipeline (Pie Chart) ===
  async getOnboardingPipeline(year, month) {
    const monthNum = new Date(`${month} 1, ${year}`).getMonth() + 1;
    const startDate = `${year}-${String(monthNum).padStart(2, "0")}-01`;
    const endDate = new Date(year, monthNum, 0).toISOString().slice(0, 10); // last day

    const query = `
    SELECT 
      COUNT(*) FILTER (WHERE employment_status IS NULL OR employment_status NOT IN ('rejected', 'shortlisted', 'blocklisted')) AS applicant,
      COUNT(*) FILTER (WHERE employment_status = 'shortlisted') AS shortlisted,
      COUNT(*) FILTER (WHERE employment_status = 'rejected') AS reject,
      COUNT(*) FILTER (WHERE employment_status = 'blocklisted') AS blocklist,
      COUNT(*) FILTER (WHERE application_status NOT IN ('Hired', 'Initial Interview', 'Final Interview', 'Examination') 
                       AND employment_status IS NULL) AS not_qualified
    FROM applicants
    WHERE applicant_created::date BETWEEN $1 AND $2
  `;

    try {
      const result = await pool.query(query, [startDate, endDate]);
      const row = result.rows[0];

      return {
        Applicant: parseInt(row.applicant || 0),
        Shortlisted: parseInt(row.shortlisted || 0),
        "Not Qualified": parseInt(row.not_qualified || 0),
        Reject: parseInt(row.reject || 0),
        Blocklist: parseInt(row.blocklist || 0),
      };
    } catch (error) {
      console.error("Error fetching onboarding pipeline:", error);
      throw new Error("Failed to fetch pipeline");
    }
  }

  // === Hiring Trend (Line Chart) ===
  async getHiringTrend(year) {
    const query = `
    SELECT 
      TO_CHAR(applicant_created, 'Month') AS month,
      EXTRACT(MONTH FROM applicant_created) AS month_num,
      COUNT(*) FILTER (WHERE application_status = 'Initial Interview') AS "Initial Interview",
      COUNT(*) FILTER (WHERE application_status = 'Examination') AS "Examination",
      COUNT(*) FILTER (WHERE application_status = 'Final Interview') AS "Final Interview",
      COUNT(*) FILTER (WHERE application_status = 'Hired' OR date_hired IS NOT NULL) AS "Hired"
    FROM applicants
    WHERE EXTRACT(YEAR FROM applicant_created) = $1
    GROUP BY TO_CHAR(applicant_created, 'Month'), month_num
    ORDER BY month_num
  `;

    try {
      const result = await pool.query(query, [year]);

      // Ensure all 12 months exist
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      return months.map((month, i) => {
        const found = result.rows.find((r) => r.month.trim() === month);
        return {
          month,
          "Initial Interview": found
            ? parseInt(found["Initial Interview"] || 0)
            : 0,
          Examination: found ? parseInt(found.Examination || 0) : 0,
          "Final Interview": found
            ? parseInt(found["Final Interview"] || 0)
            : 0,
          Hired: found ? parseInt(found.Hired || 0) : 0,
        };
      });
    } catch (error) {
      console.error("Error fetching hiring trend:", error);
      throw new Error("Failed to fetch trend");
    }
  }

  // === Upcoming Onboarding Applicants (Table) ===
  async getUpcomingOnboarding() {
    const query = `
    SELECT 
      a.first_name || ' ' || a.last_name AS name,
      ash.status_value,
      ash.comment,
      ash.updated_by,
      TO_CHAR(ash.status_created, 'Mon DD, YYYY') AS status_created
    FROM applicant_status_history ash
    JOIN applicants a ON ash.applicant_id = a.applicant_id
    WHERE ash.status_type = 'Onboarding'
      AND ash.status_value IN ('Applied', 'Rejected', 'Shortlisted')
    ORDER BY ash.status_created DESC
    LIMIT 20
  `;

    try {
      const result = await pool.query(query);
      return result.rows.map((row) => ({
        name: row.name || "Unknown Applicant",
        statusValue: row.status_value,
        comment: row.comment || "-",
        updatedBy: row.updated_by || "System",
        statusCreated: row.status_created,
      }));
    } catch (error) {
      console.error("Error fetching upcoming applicants:", error);
      throw new Error("Failed to fetch upcoming");
    }
  }

  async getOnboardingDashboardMetrics() {
    const query = `
    WITH onboarding_stats AS (
      SELECT 
        COUNT(*)::int AS total_onboardings,
        COUNT(*) FILTER (WHERE ao.is_completed = true)::int AS fully_onboarded,
        COUNT(*) FILTER (WHERE ao.is_completed = false AND ao.is_completed IS NOT NULL)::int AS in_progress,
        COUNT(*) FILTER (WHERE ao.is_completed IS NULL)::int AS pending
      FROM applicant_onboarding ao
    ),
    monthly_hires AS (
      SELECT 
        TO_CHAR(ash.status_created, 'Mon') AS month,
        EXTRACT(MONTH FROM ash.status_created) AS month_num,
        COUNT(DISTINCT ash.applicant_id) AS hires
      FROM applicant_status_history ash
      WHERE ash.status_type = 'Onboarding'
        AND ash.status_value = 'Onboarding'
        AND ash.status_created >= date_trunc('year', CURRENT_DATE)
      GROUP BY TO_CHAR(ash.status_created, 'Mon'), month_num
      ORDER BY month_num
    ),
    task_completion AS (
      SELECT 
        ot.task_id,
        ot.task_name AS task,
        COUNT(ao.applicant_id) AS total_assigned,
        COUNT(ao.applicant_id) FILTER (WHERE ao.is_completed = true) AS completed,
        ROUND(
          CASE 
            WHEN COUNT(ao.applicant_id) = 0 THEN 0
            ELSE (COUNT(ao.applicant_id) FILTER (WHERE ao.is_completed = true)::decimal / COUNT(ao.applicant_id)) * 100 
          END, 1
        ) AS completion_rate
      FROM onboarding_tasks ot
      LEFT JOIN applicant_onboarding ao ON ot.task_id = ao.task_id
      GROUP BY ot.task_id, ot.task_name
      ORDER BY completion_rate DESC
    ),
    recent_activities AS (
      SELECT 
        a.first_name || ' ' || a.last_name AS name,
        ot.task_name AS task,
        ao.status_updated AS time_ago_raw
      FROM applicant_onboarding ao
      JOIN applicants a ON ao.applicant_id = a.applicant_id
      JOIN onboarding_tasks ot ON ao.task_id = ot.task_id
      WHERE ao.status_updated >= NOW() - INTERVAL '7 days'
      ORDER BY ao.status_updated DESC
      LIMIT 10
    )
    SELECT 
      (SELECT total_onboardings FROM onboarding_stats) AS total_onboardings,
      (SELECT fully_onboarded FROM onboarding_stats) AS fully_onboarded,
      (SELECT in_progress FROM onboarding_stats) AS in_progress,
      (SELECT pending FROM onboarding_stats) AS pending,
      COALESCE((
        SELECT json_agg(json_build_object('month', mh.month, 'hires', mh.hires))
        FROM monthly_hires mh
      ), '[]') AS monthly_hires,
      COALESCE((
        SELECT json_agg(json_build_object('task_id', tc.task_id, 'task', tc.task, 'completion_rate', tc.completion_rate))
        FROM task_completion tc
      ), '[]') AS task_completion,
      COALESCE((
        SELECT json_agg(json_build_object('name', ra.name, 'task', ra.task, 'time_ago_raw', ra.time_ago_raw))
        FROM recent_activities ra
      ), '[]') AS recent_activities
  `;

    try {
      const result = await pool.query(query);
      const row = result.rows[0];

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
      const monthlyHires = monthsOrder.map((month) => {
        const found = row.monthly_hires.find((m) => m.month === month);
        return { month, hires: found ? found.hires : 0 };
      });

      return {
        totalOnboardings: row.total_onboardings || 0,
        fullyOnboarded: row.fully_onboarded || 0,
        inProgress: row.in_progress || 0,
        pending: row.pending || 0,
        monthlyHires,
        taskCompletion: row.task_completion || [],
        recentActivities: (row.recent_activities || []).map((a) => ({
          name: a.name?.trim() || "Unknown",
          task: a.task,
          timeAgoRaw: a.time_ago_raw,
        })),
      };
    } catch (error) {
      console.error("Error fetching onboarding dashboard:", error);
      throw error;
    }
  }
}

module.exports = new ReportsService();
