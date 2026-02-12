const crypto = require("crypto");
const { onlyDigits, luhnCheck } = require("../utils/luhn");

exports.simulateCardPayment = async (req, res) => {
  try {
    const { cardNumber } = req.body || {};
    const digits = onlyDigits(cardNumber);

    if (!digits) {
      return res.status(400).json({ message: "cardNumber is required" });
    }

    if (!luhnCheck(digits)) {
      return res.status(400).json({
        ok: false,
        paymentStatus: "failed",
        message: "Payment failed: invalid card number (Luhn)",
      });
    }

    const paymentId = `SIM_${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
    const last4 = digits.slice(-4);

    return res.json({
      ok: true,
      paymentStatus: "paid",
      paymentId,
      last4,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
