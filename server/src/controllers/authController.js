const {
  registerCustomer,
  loginByRole,
  verifyEmailCode,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
} = require("../services/authService");

exports.register = async (req, res) => {
  try {
    const result = await registerCustomer(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message, reason: err.reason });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const result = await verifyEmailCode(req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message, reason: err.reason });
  }
};

exports.resendVerifyCode = async (req, res) => {
  try {
    const result = await resendVerificationCode(req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message, reason: err.reason });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const result = await forgotPassword(req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message, reason: err.reason });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const result = await resetPassword(req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message, reason: err.reason });
  }
};

exports.loginCustomer = async (req, res) => {
  try {
    const result = await loginByRole({ ...req.body, role: "customer" });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const result = await loginByRole({ ...req.body, role: "admin" });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.me = async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    role: req.user.role,
    email: req.user.email,
  });
};
