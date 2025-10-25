const ReportsService = require("../services/reports.service");
const { startOfMonth, endOfMonth, format } = require("date-fns");

// Get dashboard metrics (new applicants, rejected, total applicants, conversion rate)
exports.getDashboardMetrics = async (req, res) => {
  try {
    const today = new Date();
    const startDate = format(startOfMonth(today), "yyyy-MM-dd");
    const endDate = format(endOfMonth(today), "yyyy-MM-dd");

    const [
      applicantCounts,
      conversionData,
      totalApplicants,
      newApplicantChange,
      rejectedChange,
    ] = await Promise.all([
      ReportsService.getApplicantCountsByStatus(startDate, endDate),
      ReportsService.getMonthlyConversionRate(startDate, endDate),
      ReportsService.getTotalApplicantsCount(),
      ReportsService.getStatusChangeFromLastMonth(
        "Applicant",
        startDate,
        endDate
      ),
      ReportsService.getStatusChangeFromLastMonth(
        "Rejected",
        startDate,
        endDate
      ),
    ]);

    const newApplicants = applicantCounts.reduce(
      (sum, row) => sum + parseInt(row.count, 10),
      0
    );
    const rejected =
      applicantCounts.find((row) => row.employment_status === "Rejected")
        ?.count || 0;

    res.json({
      newApplicantsThisMonth: {
        count: newApplicants,
        change: parseFloat(newApplicantChange).toFixed(2),
      },
      rejectedThisMonth: {
        count: rejected,
        change: parseFloat(rejectedChange).toFixed(2),
      },
      totalApplicants,
      conversionRate: conversionData.conversion_rate
        ? parseFloat(conversionData.conversion_rate).toFixed(2)
        : 0,
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get applicant counts by status for a custom date range
exports.getApplicantCountsByStatus = async (req, res) => {
  try {
    const { startDate, endDate } = req.query; // Expect YYYY-MM-DD format
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "startDate and endDate are required" });
    }
    const applicantCounts = await ReportsService.getApplicantCountsByStatus(
      startDate,
      endDate
    );
    res.json(applicantCounts);
  } catch (error) {
    console.error("Error fetching applicant counts by status:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get monthly conversion rate for a custom date range
exports.getMonthlyConversionRate = async (req, res) => {
  try {
    const { startDate, endDate } = req.query; // Expect YYYY-MM-DD format
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "startDate and endDate are required" });
    }
    const conversionData = await ReportsService.getMonthlyConversionRate(
      startDate,
      endDate
    );
    res.json({
      hiredCount: conversionData.hired_count,
      totalCount: conversionData.total_count,
      conversionRate: conversionData.conversion_rate
        ? parseFloat(conversionData.conversion_rate).toFixed(2)
        : 0,
    });
  } catch (error) {
    console.error("Error fetching monthly conversion rate:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get total applicants count
exports.getTotalApplicantsCount = async (req, res) => {
  try {
    const totalApplicants = await ReportsService.getTotalApplicantsCount();
    res.json({ totalApplicants });
  } catch (error) {
    console.error("Error fetching total applicants count:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get percentage change for a specific status compared to previous month
exports.getStatusChangeFromLastMonth = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query; // Expect status and date range
    if (!status || !startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "status, startDate, and endDate are required" });
    }
    const change = await ReportsService.getStatusChangeFromLastMonth(
      status,
      startDate,
      endDate
    );
    res.json({ status, change: parseFloat(change).toFixed(2) });
  } catch (error) {
    console.error("Error fetching status change:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getApplicantsByStatusMonthly = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "startDate and endDate are required" });
    }
    console.log("Fetching monthly applicants for:", { startDate, endDate }); // Debug
    const data = await ReportsService.getApplicantsByStatusMonthly(
      startDate,
      endDate
    );
    res.json(data);
  } catch (error) {
    console.error("Error fetching monthly applicants:", error);
    res.status(500).json({ message: error.message });
  }
};
