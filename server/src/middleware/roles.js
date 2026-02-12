exports.requireCustomer = (req, res, next) => {
  if (!req.user || req.user.role !== "customer") {
    return res.status(403).json({ message: "Customer access only" });
  }
  next();
};
