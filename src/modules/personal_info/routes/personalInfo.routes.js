const express = require("express");
const router = express.Router();
const personalInfoController = require("../controllers/personalInfo.controller");
const authMiddleware = require("../../../middlewares/auth");

router.post("/", authMiddleware, personalInfoController.createPersonalInfo);
router.get("/", authMiddleware, personalInfoController.getAllPersonalInfo);
router.get("/:id", authMiddleware, personalInfoController.getPersonalInfoById);
router.put("/:id", authMiddleware, personalInfoController.updatePersonalInfo);
router.delete(
  "/:id",
  authMiddleware,
  personalInfoController.deletePersonalInfo
);

module.exports = router;
