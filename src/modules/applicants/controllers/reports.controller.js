// controllers/reports.controller.js
const ReportsService = require("../services/reports.service");
const { startOfMonth, endOfMonth, subMonths, format } = require("date-fns");

exports.getDashboardMetrics = async (req, res) => {
  try {
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);

    const prevMonthStart = startOfMonth(subMonths(today, 1));
    const prevMonthEnd = endOfMonth(subMonths(today, 1));

    // Format for DB (PostgreSQL)
    const formatDate = (d) => format(d, "yyyy-MM-dd");

    const [
      currentNewApplicants,
      prevNewApplicants,
      currentRejected,
      prevRejected,
      conversionData,
      totalApplicants,
    ] = await Promise.all([
      // 1. New Applicants This Month (anyone created this month)
      ReportsService.getCountByCreatedDate(
        formatDate(currentMonthStart),
        formatDate(currentMonthEnd)
      ),
      ReportsService.getCountByCreatedDate(
        formatDate(prevMonthStart),
        formatDate(prevMonthEnd)
      ),

      // 2. Rejected This Month (from status history)
      ReportsService.getRejectedCountThisMonth(
        formatDate(currentMonthStart),
        formatDate(currentMonthEnd)
      ),
      ReportsService.getRejectedCountThisMonth(
        formatDate(prevMonthStart),
        formatDate(prevMonthEnd)
      ),

      // 3. Conversion Rate This Month (Hired / Total Applied)
      ReportsService.getMonthlyConversionRate(
        formatDate(currentMonthStart),
        formatDate(currentMonthEnd)
      ),

      // 4. Total All-Time Applicants
      ReportsService.getTotalApplicantsCount(),
    ]);

    // Calculate percentage changes
    const calculateChange = (current, prev) => {
      if (prev === 0) return current > 0 ? "100.00" : "0.00";
      const change = ((current - prev) / prev) * 100;
      return change.toFixed(2);
    };

    const newApplicantChange = calculateChange(
      currentNewApplicants,
      prevNewApplicants
    );
    const rejectedChange = calculateChange(currentRejected, prevRejected);

    res.json({
      newApplicantsThisMonth: {
        count: currentNewApplicants,
        change: newApplicantChange, // already string with sign
      },
      rejectedThisMonth: {
        count: currentRejected,
        change: rejectedChange,
      },
      totalApplicants,
      conversionRate: conversionData.conversion_rate
        ? Number(conversionData.conversion_rate).toFixed(1)
        : 0,
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getRecentApplicants = async (req, res) => {
  try {
    const applicants = await ReportsService.getRecentApplicants();
    res.json(applicants);
  } catch (error) {
    console.error("Error in getRecentApplicants controller:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getApplicantSources = async (req, res) => {
  try {
    const sources = await ReportsService.getApplicantSources();
    res.json(sources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMonthlyHiredVsRejected = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const data = await ReportsService.getMonthlyHiredVsRejected(year);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
