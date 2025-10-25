const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1]; // Expecting "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user payload to request
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token or Expired Token" });
  }
}

module.exports = authMiddleware;
