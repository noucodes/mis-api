const userService = require("../services/user.services");

exports.createUser = async (req, res) => {
  try {
    const data = req.body;
    const { message, user } = await userService.createUserService(data);
    res.status(201).json({ message, user });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const data = req.body;
    const { message, token, user } = await userService.loginUserService(data);
    res.status(200).json({ message, token, user });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const data = req.params.id;
    const { message, token, user } = await userService.getUserService(data);
    res.status(200).json({ message, token, user });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};