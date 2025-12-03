// src/modules/attendance/route/user.history.js
const express = require("express");
const { neon } = require("@neondatabase/serverless");

const router = express.Router();
const sql = neon(process.env.DATABASE_URL);

// GET / - Get all attendance history (all punch records)
// This will be accessed at /api/attendance/history
router.get("/", async (req, res) => {
  try {
    const { employee_id, start_date, end_date, limit = 100, offset = 0 } = req.query;

    let query = sql`
      SELECT 
        id,
        employee_id,
        employee_name,
        punch_time,
        TO_CHAR(punch_time, 'MM/DD/YYYY') AS punch_date,
        TO_CHAR(punch_time, 'HH12:MI:SS AM') AS punch_time_formatted,
        created_at
      FROM attendance_history
      WHERE 1=1
    `;

    // Filter by employee_id if provided
    if (employee_id) {
      query = sql`
        SELECT 
          id,
          employee_id,
          employee_name,
          punch_time,
          TO_CHAR(punch_time, 'MM/DD/YYYY') AS punch_date,
          TO_CHAR(punch_time, 'HH12:MI:SS AM') AS punch_time_formatted,
          created_at
        FROM attendance_history
        WHERE employee_id = ${employee_id}
      `;
    }

    // Filter by date range if provided
    if (start_date && end_date) {
      query = sql`
        SELECT 
          id,
          employee_id,
          employee_name,
          punch_time,
          TO_CHAR(punch_time, 'MM/DD/YYYY') AS punch_date,
          TO_CHAR(punch_time, 'HH12:MI:SS AM') AS punch_time_formatted,
          created_at
        FROM attendance_history
        WHERE punch_time >= ${start_date}::timestamp 
          AND punch_time <= ${end_date}::timestamp
          ${employee_id ? sql`AND employee_id = ${employee_id}` : sql``}
        ORDER BY punch_time DESC
        LIMIT ${parseInt(limit)}
        OFFSET ${parseInt(offset)}
      `;
    } else if (start_date) {
      query = sql`
        SELECT 
          id,
          employee_id,
          employee_name,
          punch_time,
          TO_CHAR(punch_time, 'MM/DD/YYYY') AS punch_date,
          TO_CHAR(punch_time, 'HH12:MI:SS AM') AS punch_time_formatted,
          created_at
        FROM attendance_history
        WHERE punch_time >= ${start_date}::timestamp
          ${employee_id ? sql`AND employee_id = ${employee_id}` : sql``}
        ORDER BY punch_time DESC
        LIMIT ${parseInt(limit)}
        OFFSET ${parseInt(offset)}
      `;
    } else {
      // No date filter, just get recent records
      query = sql`
        SELECT 
          id,
          employee_id,
          employee_name,
          punch_time,
          TO_CHAR(punch_time, 'MM/DD/YYYY') AS punch_date,
          TO_CHAR(punch_time, 'HH12:MI:SS AM') AS punch_time_formatted,
          created_at
        FROM attendance_history
        ${employee_id ? sql`WHERE employee_id = ${employee_id}` : sql``}
        ORDER BY punch_time DESC
        LIMIT ${parseInt(limit)}
        OFFSET ${parseInt(offset)}
      `;
    }

    const history = await query;

    // Get total count for pagination
    let countQuery = sql`SELECT COUNT(*) as total FROM attendance_history`;
    
    if (employee_id && start_date && end_date) {
      countQuery = sql`
        SELECT COUNT(*) as total 
        FROM attendance_history 
        WHERE employee_id = ${employee_id}
          AND punch_time >= ${start_date}::timestamp 
          AND punch_time <= ${end_date}::timestamp
      `;
    } else if (employee_id) {
      countQuery = sql`
        SELECT COUNT(*) as total 
        FROM attendance_history 
        WHERE employee_id = ${employee_id}
      `;
    } else if (start_date && end_date) {
      countQuery = sql`
        SELECT COUNT(*) as total 
        FROM attendance_history 
        WHERE punch_time >= ${start_date}::timestamp 
          AND punch_time <= ${end_date}::timestamp
      `;
    } else if (start_date) {
      countQuery = sql`
        SELECT COUNT(*) as total 
        FROM attendance_history 
        WHERE punch_time >= ${start_date}::timestamp
      `;
    }

    const countResult = await countQuery;
    const total = parseInt(countResult[0].total);

    return res.json({
      success: true,
      data: history,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit)
      }
    });

  } catch (err) {
    console.error("Attendance History Error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch attendance history",
      message: err.message
    });
  }
});

// GET /:employee_id - Get history for specific employee
// This will be accessed at /api/attendance/history/:employee_id
router.get("/:employee_id", async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { start_date, end_date, limit = 50 } = req.query;

    let query;

    if (start_date && end_date) {
      query = sql`
        SELECT 
          id,
          employee_id,
          employee_name,
          punch_time,
          TO_CHAR(punch_time, 'MM/DD/YYYY') AS punch_date,
          TO_CHAR(punch_time, 'HH12:MI:SS AM') AS punch_time_formatted,
          created_at
        FROM attendance_history
        WHERE employee_id = ${employee_id}
          AND punch_time >= ${start_date}::timestamp 
          AND punch_time <= ${end_date}::timestamp
        ORDER BY punch_time DESC
        LIMIT ${parseInt(limit)}
      `;
    } else {
      query = sql`
        SELECT 
          id,
          employee_id,
          employee_name,
          punch_time,
          TO_CHAR(punch_time, 'MM/DD/YYYY') AS punch_date,
          TO_CHAR(punch_time, 'HH12:MI:SS AM') AS punch_time_formatted,
          created_at
        FROM attendance_history
        WHERE employee_id = ${employee_id}
        ORDER BY punch_time DESC
        LIMIT ${parseInt(limit)}
      `;
    }

    const history = await query;

    if (history.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No attendance history found for this employee"
      });
    }

    return res.json({
      success: true,
      employee_id,
      employee_name: history[0].employee_name,
      data: history
    });

  } catch (err) {
    console.error("Employee History Error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch employee attendance history",
      message: err.message
    });
  }
});

// GET /date/:date - Get all punches for a specific date
// This will be accessed at /api/attendance/history/date/:date
router.get("/date/:date", async (req, res) => {
  try {
    const { date } = req.params; // Format: YYYY-MM-DD

    console.log(`📅 Fetching history for date: ${date}`);

    const history = await sql`
      SELECT 
        id,
        employee_id,
        employee_name,
        punch_time,
        TO_CHAR(punch_time, 'MM/DD/YYYY') AS punch_date,
        TO_CHAR(punch_time, 'HH12:MI:SS AM') AS punch_time_formatted,
        created_at
      FROM attendance_history
      WHERE DATE(punch_time) = ${date}::date
      ORDER BY punch_time ASC
    `;

    console.log(`✅ Found ${history.length} punch records for ${date}`);

    return res.json({
      success: true,
      date,
      total_punches: history.length,
      data: history
    });

  } catch (err) {
    console.error("❌ Date History Error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch attendance history for date",
      message: err.message
    });
  }
});

module.exports = router;