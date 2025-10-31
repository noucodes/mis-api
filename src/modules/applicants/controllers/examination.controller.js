const ExaminationService = require("../services/examination.service");

// Get examination results by applicant ID
exports.getExaminationByApplicantId = async (req, res) => {
  try {
    const { applicantId } = req.params;

    // Validate applicantId is an integer
    const id = parseInt(applicantId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid applicant ID" });
    }

    const examination = await ExaminationService.getExaminationByApplicantId(
      id
    );
    if (!examination) {
      return res.status(404).json({ message: "Examination results not found" });
    }

    res.json(examination);
  } catch (error) {
    console.error("Error fetching examination results:", error);
    res.status(500).json({ message: error.message });
  }
};

// Create Phase One result
exports.createPhaseOneResult = async (req, res) => {
  try {
    const { applicantId } = req.params;
    const { result } = req.body;

    // Validate inputs
    const id = parseInt(applicantId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid applicant ID" });
    }
    if (!result || typeof result !== "string") {
      return res.status(400).json({ message: "Invalid result" });
    }

    const phaseOneResult = await ExaminationService.createPhaseOneResult(
      id,
      result
    );
    res.status(201).json(phaseOneResult);
  } catch (error) {
    console.error("Error creating Phase One result:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update Phase One result
exports.updatePhaseOneResult = async (req, res) => {
  try {
    const { applicantId } = req.params;
    const { result } = req.body;

    // Validate inputs
    const id = parseInt(applicantId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid applicant ID" });
    }
    if (!result || typeof result !== "string") {
      return res.status(400).json({ message: "Invalid result" });
    }

    const phaseOneResult = await ExaminationService.updatePhaseOneResult(
      id,
      result
    );
    if (!phaseOneResult) {
      return res.status(404).json({ message: "Phase One result not found" });
    }

    res.json(phaseOneResult);
  } catch (error) {
    console.error("Error updating Phase One result:", error);
    res.status(500).json({ message: error.message });
  }
};

// Create Phase Two result
exports.createPhaseTwoResult = async (req, res) => {
  try {
    const { applicantId } = req.params;
    const { result } = req.body;

    // Validate inputs
    const id = parseInt(applicantId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid applicant ID" });
    }
    if (!result || typeof result !== "string") {
      return res.status(400).json({ message: "Invalid result" });
    }

    const phaseTwoResult = await ExaminationService.createPhaseTwoResult(
      id,
      result
    );
    res.status(201).json(phaseTwoResult);
  } catch (error) {
    console.error("Error creating Phase Two result:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update Phase Two result
exports.updatePhaseTwoResult = async (req, res) => {
  try {
    const { applicantId } = req.params;
    const { result } = req.body;

    // Validate inputs
    const id = parseInt(applicantId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid applicant ID" });
    }
    if (!result || typeof result !== "string") {
      return res.status(400).json({ message: "Invalid result" });
    }

    const phaseTwoResult = await ExaminationService.updatePhaseTwoResult(
      id,
      result
    );
    if (!phaseTwoResult) {
      return res.status(404).json({ message: "Phase Two result not found" });
    }

    res.json(phaseTwoResult);
  } catch (error) {
    console.error("Error updating Phase Two result:", error);
    res.status(500).json({ message: error.message });
  }
};

// Create Phase Three result
exports.createPhaseThreeResult = async (req, res) => {
  try {
    const { applicantId } = req.params;
    const { wpm, image_url } = req.body;

    // Validate inputs
    const id = parseInt(applicantId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid applicant ID" });
    }
    if (
      typeof wpm !== "number" ||
      !image_url ||
      typeof image_url !== "string"
    ) {
      return res.status(400).json({ message: "Invalid wpm or image_url" });
    }

    const phaseThreeResult = await ExaminationService.createPhaseThreeResult(
      id,
      { wpm, image_url }
    );
    res.status(201).json(phaseThreeResult);
  } catch (error) {
    console.error("Error creating Phase Three result:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update Phase Three result
exports.updatePhaseThreeResult = async (req, res) => {
  try {
    const { applicantId } = req.params;
    const { wpm, image_url } = req.body;

    // Validate inputs
    const id = parseInt(applicantId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid applicant ID" });
    }
    if (
      (wpm !== undefined && typeof wpm !== "number") ||
      (image_url !== undefined && typeof image_url !== "string")
    ) {
      return res.status(400).json({ message: "Invalid wpm or image_url" });
    }

    const phaseThreeResult = await ExaminationService.updatePhaseThreeResult(
      id,
      { wpm, image_url }
    );
    if (!phaseThreeResult) {
      return res.status(404).json({ message: "Phase Three result not found" });
    }

    res.json(phaseThreeResult);
  } catch (error) {
    console.error("Error updating Phase Three result:", error);
    res.status(500).json({ message: error.message });
  }
};

// Create Phase Four result
exports.createPhaseFourResult = async (req, res) => {
  try {
    const { applicantId } = req.params;
    const { file_url } = req.body;

    // Validate inputs
    const id = parseInt(applicantId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid applicant ID" });
    }
    if (!file_url || typeof file_url !== "string") {
      return res.status(400).json({ message: "Invalid file_url" });
    }

    const phaseFourResult = await ExaminationService.createPhaseFourResult(
      id,
      file_url
    );
    res.status(201).json(phaseFourResult);
  } catch (error) {
    console.error("Error creating Phase Four result:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update Phase Four result
exports.updatePhaseFourResult = async (req, res) => {
  try {
    const { applicantId } = req.params;
    const { file_url } = req.body;

    // Validate inputs
    const id = parseInt(applicantId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid applicant ID" });
    }
    if (!file_url || typeof file_url !== "string") {
      return res.status(400).json({ message: "Invalid file_url" });
    }

    const phaseFourResult = await ExaminationService.updatePhaseFourResult(
      id,
      file_url
    );
    if (!phaseFourResult) {
      return res.status(404).json({ message: "Phase Four result not found" });
    }

    res.json(phaseFourResult);
  } catch (error) {
    console.error("Error updating Phase Four result:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete all examination results for an applicant
exports.deleteExaminationByApplicantId = async (req, res) => {
  try {
    const { applicantId } = req.params;

    // Validate applicantId is an integer
    const id = parseInt(applicantId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid applicant ID" });
    }

    const result = await ExaminationService.deleteExaminationByApplicantId(id);
    res.json(result);
  } catch (error) {
    console.error("Error deleting examination results:", error);
    res.status(500).json({ message: error.message });
  }
};
