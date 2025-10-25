const OnboardingService = require("../services/onboarding.service");

exports.getAllApplicants = async (req, res) => {
  try {
    const applicants = await OnboardingService.getAllApplicants();
    res.status(200).json(applicants);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch applicants", error: error.message });
  }
};

// Get tasks for a specific applicant
exports.getTasksByApplicant = async (req, res) => {
  try {
    const { id: applicantId } = req.params;
    const tasks = await OnboardingService.getTasksByApplicant(applicantId);
    res.status(200).json({ tasks });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch tasks", error: error.message });
  }
};

exports.getTasksMasterlist = async (req, res) => {
  try {
    const tasks = await OnboardingService.getTasksMasterlist();
    res.status(200).json({ tasks });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch tasks masterlist",
      error: error.message,
    });
  }
};

// ✅ New method
exports.initializeApplicantTasks = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await OnboardingService.initializeApplicantTasks(id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to initialize applicant tasks" });
  }
};

// Update or create task status
exports.updateTaskStatus = async (req, res) => {
  try {
    const { id: applicantId, taskId } = req.params; // Extract taskId from URL
    const { status, isCompleted } = req.body;
    if (!taskId || !applicantId) {
      return res
        .status(400)
        .json({ message: "taskId and applicantId are required" });
    }
    const result = await OnboardingService.updateTaskStatus({
      taskId,
      status,
      applicantId,
      isCompleted,
    });
    res.status(200).json(result); // Use 200 for PATCH success
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update task status", error: error.message });
  }
};

// Get all onboarding records (optional, for debugging or reporting)
exports.getAllOnboardingRecords = async (req, res) => {
  try {
    const records = await OnboardingService.getAllOnboardingRecords();
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch onboarding records",
      error: error.message,
    });
  }
};
