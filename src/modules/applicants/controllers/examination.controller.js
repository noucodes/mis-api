const ApplicantsService = require("../services/applicants.service");

// Create application with unique examination code
exports.createApplication = async (req, res) => {
  try {
    const data = req.body; // applicant info (e.g., name, position)
    const application = await ApplicantsService.createApplicant(data);
    res.status(201).json(application);
  } catch (error) {
    console.error("Error creating application:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all applications
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await ApplicantsService.getAllApplicants();
    res.json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all applications by status
exports.getAllApplicationsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const applications = await ApplicantsService.getAllApplicantsByStatus(
      status
    );
    res.json(applications);
  } catch (error) {
    console.error("Error fetching applications by status:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get application by ID
exports.getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate id is an integer
    const applicantId = parseInt(id, 10);
    if (isNaN(applicantId)) {
      return res.status(400).json({ message: "Invalid applicant ID" });
    }

    const application = await ApplicantsService.getApplicantById(applicantId);
    if (!application)
      return res.status(404).json({ message: "Application not found" });

    res.json(application);
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update application
exports.updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const application = await ApplicantsService.updateApplicant(id, data);
    if (!application)
      return res.status(404).json({ message: "Application not found" });
    res.json(application);
  } catch (error) {
    console.error("Error updating application:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete application
exports.deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await ApplicantsService.deleteApplicant(id);
    if (!application)
      return res.status(404).json({ message: "Application not found" });
    res.json({ message: "Application deleted successfully" });
  } catch (error) {
    console.error("Error deleting application:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getRecentApplicants = async (req, res) => {
  try {
    const applicants = await ApplicantsService.getRecentApplicants();
    res.json(applicants);
  } catch (error) {
    console.error("Error fetching recent applicants:", error);
    res.status(500).json({ message: error.message });
  }
};
