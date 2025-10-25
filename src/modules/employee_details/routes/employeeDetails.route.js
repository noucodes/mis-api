const express = require("express");
const router = express.Router();
const employeeDetailsController = require("../controllers/employeeDetails.contoller");
const authMiddleware = require("../../../middlewares/auth");

router.post(
  "/",
  authMiddleware,
  employeeDetailsController.createEmployeeDetails
);
router.get(
  "/",
  authMiddleware,
  employeeDetailsController.getAllEmployeeDetails
);
router.get(
  "/:id",
  authMiddleware,
  employeeDetailsController.getEmployeeDetailsById
);
router.put(
  "/:id",
  authMiddleware,
  employeeDetailsController.updateEmployeeDetails
);
router.delete(
  "/:id",
  authMiddleware,
  employeeDetailsController.deleteEmployeeDetails
);

module.exports = router;
