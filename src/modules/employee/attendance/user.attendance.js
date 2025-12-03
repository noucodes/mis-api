// src/modules/employee/attendance/user.attendance.js
const express = require("express");
const { neon } = require("@neondatabase/serverless");
const ZKLib = require("node-zklib");

const router = express.Router();
const sql = neon(process.env.DATABASE_URL);

// Helper: "7:17:29 AM" → minutes since midnight
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || timeStr === "—" || timeStr.trim() === "") return -1;
  const match = timeStr.match(/(\d+):(\d+):?(\d+)?\s*(AM|PM)/i);
  if (!match) return -1;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (match[4] === "PM" && h !== 12) h += 12;
  if (match[4] === "AM" && h === 12) h = 0;
  return h * 60 + m;
};

// Helper: minutes → "8h 15m"
const minutesToHours = (totalMinutes) => {
  if (totalMinutes < 0) return "—";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
};

// Calculate Overtime & Undertime
const calculateOTAndUndertime = (hoursWorked) => {
  if (!hoursWorked || hoursWorked === "—") return { overtime: "—", undertime: "—" };

  const match = hoursWorked.match(/(\d+)h\s+(\d+)m/);
  if (!match) return { overtime: "—", undertime: "—" };

  const totalMins = parseInt(match[1]) * 60 + parseInt(match[2]);
  const requiredMins = 8 * 60;

  if (totalMins > requiredMins) {
    const otMins = totalMins - requiredMins;
    const otH = Math.floor(otMins / 60);
    const otM = otMins % 60;
    return { overtime: `+${otH}h ${otM.toString().padStart(2, "0")}m`, undertime: "—" };
  } else if (totalMins < requiredMins) {
    const utMins = requiredMins - totalMins;
    const utH = Math.floor(utMins / 60);
    const utM = utMins % 60;
    return {
      overtime: "—",
      undertime: `-${utH > 0 ? utH + "h " : ""}${utM}m`.trim(),
    };
  }
  return { overtime: "—", undertime: "—" };
};

// Calculate worked hours (deduct 1h lunch if crossed 12:00–1:00 PM)
const calculateWorkedHours = (timeIn, timeOut) => {
  const inMins = parseTimeToMinutes(timeIn);
  const outMins = parseTimeToMinutes(timeOut);

  // Still clocked in → calculate up to now
  if (inMins !== -1 && outMins === -1) {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    let worked = currentMins - inMins;
    if (currentMins >= 750) worked -= 60; // after 12:30 PM, assume lunch taken
    return minutesToHours(worked);
  }

  if (inMins !== -1 && outMins !== -1 && outMins > inMins) {
    let worked = outMins - inMins;
    // If logged in before 11:30 AM and out after 1:00 PM → deduct lunch
    if (inMins <= 690 && outMins >= 780) worked -= 60;
    return minutesToHours(worked);
  }

  return "—";
};

// Determine status + color
const getStatus = (timeIn, timeOut, hoursWorked) => {
  const inMins = parseTimeToMinutes(timeIn);
  const outMins = parseTimeToMinutes(timeOut);

  if (inMins === -1) return { status: "Absent", color: "text-red-600 dark:text-red-400" };

  const workedMins = hoursWorked === "—" ? 0 : parseTimeToMinutes("0h " + hoursWorked.replace(/h|m/g, "")) || 0;

  if (outMins !== -1 && outMins < 1020) return { status: "Early Out", color: "text-purple-600 dark:text-purple-400" }; // before 5:00 PM

  if (outMins === -1) {
    // Still inside
    if (inMins <= 540) return { status: "Present (On Time)", color: "text-green-600 dark:text-green-400" }; // ≤ 9:00 AM
    if (inMins <= 690) return { status: "Present (Late)", color: "text-orange-600 dark:text-orange-400" }; // ≤ 11:30 AM
    return { status: "Half Day (Late)", color: "text-red-600 dark:text-red-400" };
  }

  if (workedMins >= 480) {
    return { status: "Full Day", color: "text-emerald-600 dark:text-emerald-400 font-bold" };
  }

  return { status: "Undertime", color: "text-orange-600 dark:text-orange-400" };
};

// GET / - Get attendance data for specific employee
router.get("/", async (req, res) => {
  let zk = null;

  try {
    // Get employeeId from authenticated user (JWT payload)
    const employeeId = req.user?.employeeId;

    console.log("✅ Authenticated user:", req.user);
    console.log("✅ Employee ID:", employeeId);

    if (!employeeId) {
      console.error("❌ Employee ID not found in token payload");
      return res.status(401).json({
        error: "Unauthorized",
        message: "Employee ID not found in token. Please login again.",
      });
    }

    const dateParam = req.query.date;
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const tomorrow = new Date(targetDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = targetDate.toISOString().split("T")[0];

    // 1. Get employee name from users table
    const employeeName = req.user?.name || "Unknown";
    const empId = String(employeeId);

    console.log(`📋 Fetching attendance for Employee: ${employeeName} (ID: ${empId}) on ${dateStr}`);

    // 2. Connect to ZKTeco device
    zk = new ZKLib("192.168.4.227", 4370, 10000, 4000);
    await zk.createSocket();
    const logs = await zk.getAttendances();
    await zk.disconnect();
    zk = null;

    console.log(`✅ Retrieved ${logs.data?.length || 0} total logs from device`);

    // 3. Filter logs for this specific employee and date
    const userLogsToday = (logs.data || [])
      .filter((log) => {
        const uid = String(log.deviceUserId || log.userId || log.uid || log.id || log.userSn);
        const t = new Date(log.recordTime);
        return uid === empId && t >= targetDate && t < tomorrow;
      })
      .sort((a, b) => new Date(a.recordTime).getTime() - new Date(b.recordTime).getTime());

    console.log(`📊 Found ${userLogsToday.length} logs for employee ${empId}`);

    let timeIn = "—";
    let timeOut = "—";

    if (userLogsToday.length > 0) {
      timeIn = new Date(userLogsToday[0].recordTime).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      });
    }
    if (userLogsToday.length > 1) {
      timeOut = new Date(userLogsToday[userLogsToday.length - 1].recordTime).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      });
    }

    const hoursWorked = calculateWorkedHours(timeIn, timeOut);
    const { status, color } = getStatus(timeIn, timeOut, hoursWorked);
    const { overtime, undertime } = calculateOTAndUndertime(hoursWorked);

    const displayDate = userLogsToday.length > 0
      ? new Date(userLogsToday[0].recordTime).toLocaleDateString("en-US")
      : targetDate.toLocaleDateString("en-US");

    // 4. Save raw punches to history (deduplicated)
    for (const tap of userLogsToday) {
      const punchTime = new Date(tap.recordTime);
      const exists = await sql`
        SELECT 1 FROM attendance_history 
        WHERE employee_id = ${empId} AND punch_time = ${punchTime} 
        LIMIT 1
      `;
      if (exists.length === 0) {
        await sql`
          INSERT INTO attendance_history (employee_id, employee_name, punch_time)
          VALUES (${empId}, ${employeeName}, ${punchTime})
        `;
      }
    }

    // 5. UPSERT daily summary
    await sql`
      INSERT INTO attendance_logs (
        employee_id, employee_name, attendance_date,
        time_in, time_out, hours_worked, overtime, undertime,
        status, total_taps, updated_at
      ) VALUES (
        ${empId}, ${employeeName}, ${dateStr},
        ${timeIn}, ${timeOut}, ${hoursWorked},
        ${overtime}, ${undertime}, ${status},
        ${userLogsToday.length}, NOW()
      )
      ON CONFLICT (employee_id, attendance_date) 
      DO UPDATE SET
        time_in = EXCLUDED.time_in,
        time_out = EXCLUDED.time_out,
        hours_worked = EXCLUDED.hours_worked,
        overtime = EXCLUDED.overtime,
        undertime = EXCLUDED.undertime,
        status = EXCLUDED.status,
        total_taps = EXCLUDED.total_taps,
        updated_at = NOW();
    `;

    const result = {
      userId: empId,
      name: employeeName,
      date: displayDate,
      timeIn,
      timeOut,
      hoursWorked,
      status,
      statusColor: color,
      overtime,
      undertime,
      totalTaps: userLogsToday.length,
    };

    console.log(`✅ Success: Retrieved attendance for employee ${empId} (${employeeName}) on ${dateStr}`);
    return res.json({ 
      attendance: result, 
      source: "device" 
    });

  } catch (err) {
    console.error("❌ ZKTeco Error:", err.message);
    if (zk) await zk.disconnect().catch(() => {});

    // Fallback: Load from database
    try {
      const employeeId = req.user?.employeeId;
      
      if (!employeeId) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Employee ID not found in token. Please login again.",
        });
      }

      const dateParam = req.query.date || new Date().toISOString().split("T")[0];

      console.log(`⚠️ Falling back to database for employee ${employeeId} on ${dateParam}`);

      const fallback = await sql`
        SELECT 
          employee_id AS "userId",
          employee_name AS name,
          TO_CHAR(attendance_date, 'MM/DD/YYYY') AS date,
          time_in AS "timeIn",
          time_out AS "timeOut",
          hours_worked AS "hoursWorked",
          overtime,
          undertime,
          status,
          total_taps AS "totalTaps",
          CASE 
            WHEN status = 'Full Day' THEN 'text-emerald-600 dark:text-emerald-400 font-bold'
            WHEN status LIKE 'Present%' THEN 'text-green-600 dark:text-green-400'
            WHEN status = 'Early Out' THEN 'text-purple-600 dark:text-purple-400'
            WHEN status LIKE 'Half Day%' THEN 'text-yellow-600 dark:text-yellow-400'
            WHEN status = 'Absent' THEN 'text-red-600 dark:text-red-400'
            ELSE 'text-orange-600 dark:text-orange-400'
          END AS "statusColor"
        FROM attendance_logs
        WHERE employee_id = ${String(employeeId)} 
          AND attendance_date = ${dateParam}
        LIMIT 1
      `;

      if (fallback.length === 0) {
        console.log(`ℹ️ No attendance record found for employee ${employeeId} on ${dateParam}`);
        return res.json({
          attendance: null,
          source: "database (device offline)",
          warning: "No attendance record found for this date",
        });
      }

      console.log(`✅ Successfully retrieved attendance from database`);
      return res.json({
        attendance: fallback[0],
        source: "database (device offline)",
        warning: "Device offline — showing last saved data",
      });

    } catch (dbErr) {
      console.error("❌ Database fallback failed:", dbErr.message);
      return res.status(500).json({
        attendance: null,
        source: "error",
        error: "System completely offline. Please contact IT support.",
      });
    }
  }
});

module.exports = router;