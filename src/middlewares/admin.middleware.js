const authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Administrator privileges are required for this action."
    });
  }
  next();
};

module.exports = {
  authorizeAdmin
};

