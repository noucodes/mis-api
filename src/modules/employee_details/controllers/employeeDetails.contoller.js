const EmployeeDetailsService = require("../services/employeeDetails.service");

exports.createEmployeeDetails = async (req, res) => {
  try {
    const data = { ...req.body, user_id: req.user.id };
    const EmployeeDetails = await EmployeeDetailsService.createEmployeeDetails(
      data
    );
    res.status(201).json(EmployeeDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllEmployeeDetails = async (req, res) => {
  try {
    const EmployeeDetails =
      await EmployeeDetailsService.getAllEmployeeDetails();
    res.json(EmployeeDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEmployeeDetailsById = async (req, res) => {
  try {
    const user_id = req.user.id; // Use authenticated user_id
    const EmployeeDetails = await EmployeeDetailsService.getEmployeeDetailsById(
      user_id
    );
    if (!EmployeeDetails)
      return res.status(404).json({ message: "Personal info not found" });
    res.json(EmployeeDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateEmployeeDetails = async (req, res) => {
  try {
    const user_id = req.user.id; // Use authenticated user_id
    const data = req.body;
    const EmployeeDetails = await EmployeeDetailsService.updateEmployeeDetails(
      user_id,
      data
    );
    if (!EmployeeDetails)
      return res.status(404).json({ message: "Personal info not found" });
    res.json(EmployeeDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteEmployeeDetails = async (req, res) => {
  try {
    const user_id = req.user.id; // Use authenticated user_id
    const EmployeeDetails = await EmployeeDetailsService.deleteEmployeeDetails(
      user_id
    );
    if (!EmployeeDetails)
      return res.status(404).json({ message: "Personal info not found" });
    res.json({ message: "Personal info deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
