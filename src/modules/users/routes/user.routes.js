const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const debugLogger = require("../../../middlewares/logging");
// const authMiddleware = require("../../../middlewares/auth");

router.use(debugLogger);
// Register
router.post("/register", userController.createUser);

// Login
router.post("/login", userController.loginUser);

// Get User
// router.get("/:id", authMiddleware, userController.getUser);

module.exports = router;

// Gikapoy nakuuuu
