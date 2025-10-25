const debugLogger = (req, res, next) => {
  console.log("=== Request Debug Info ===");
  console.log("URL:", req.originalUrl);
  console.log("Method:", req.method);
  console.log("Route Params:", req.params);
  console.log("Query Params:", req.query);
  console.log("Body:", req.body);
  console.log("Headers:", req.headers);
  console.log("=========================");
  next();
};

module.exports = debugLogger;
