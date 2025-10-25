const PersonalInfoService = require("../services/personalInfo.service");

exports.createPersonalInfo = async (req, res) => {
  try {
    const data = { ...req.body, user_id: req.user.id };
    const personalInfo = await PersonalInfoService.createPersonalInfo(data);
    res.status(201).json(personalInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllPersonalInfo = async (req, res) => {
  try {
    const personalInfo = await PersonalInfoService.getAllPersonalInfo();
    res.json(personalInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPersonalInfoById = async (req, res) => {
  try {
    const user_id = req.user.id; // Use authenticated user_id
    const personalInfo = await PersonalInfoService.getPersonalInfoById(user_id);
    if (!personalInfo)
      return res.status(404).json({ message: "Personal info not found" });
    res.json(personalInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePersonalInfo = async (req, res) => {
  try {
    const user_id = req.user.id; // Use authenticated user_id
    const data = req.body;
    const personalInfo = await PersonalInfoService.updatePersonalInfo(
      user_id,
      data
    );
    if (!personalInfo)
      return res.status(404).json({ message: "Personal info not found" });
    res.json(personalInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletePersonalInfo = async (req, res) => {
  try {
    const user_id = req.user.id; // Use authenticated user_id
    const personalInfo = await PersonalInfoService.deletePersonalInfo(user_id);
    if (!personalInfo)
      return res.status(404).json({ message: "Personal info not found" });
    res.json({ message: "Personal info deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
