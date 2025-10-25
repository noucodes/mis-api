const StatusService = require("../services/status.service");

// Create new status history record
exports.createStatus = async (req, res) => {
  try {
    const data = req.body; // { applicant_id, status, status_schedule }
    const statusRecord = await StatusService.createStatus(data);
    res.status(201).json(statusRecord);
  } catch (error) {
    console.error("Error creating status:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all status history
exports.getAllStatuses = async (req, res) => {
  try {
    const statuses = await StatusService.getAllStatuses();
    res.json(statuses);
  } catch (error) {
    console.error("Error fetching statuses:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get status history for a specific applicant
exports.getStatusHistoryByApplicant = async (req, res) => {
  try {
    const { applicantId } = req.params;
    const statuses = await StatusService.getStatusHistoryByApplicant(
      applicantId
    );
    res.json(statuses);
  } catch (error) {
    console.error("Error fetching statuses by applicant:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update a specific status record
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params; // status id
    const data = req.body; // { status, status_schedule }
    const updated = await StatusService.updateStatus(id, data);
    if (!updated) return res.status(404).json({ message: "Status not found" });
    res.json(updated);
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete a specific status record
exports.deleteStatus = async (req, res) => {
  try {
    const { id } = req.params; // status id
    const deleted = await StatusService.deleteStatus(id);
    if (!deleted) return res.status(404).json({ message: "Status not found" });
    res.json({ message: "Status deleted successfully" });
  } catch (error) {
    console.error("Error deleting status:", error);
    res.status(500).json({ message: error.message });
  }
};
