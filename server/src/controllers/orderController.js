const orderService = require("../services/orderService");

exports.checkout = async (req, res) => {
  try {
    const { paymentMethod, paymentId, paymentLast4 } = req.body || {};

    const order = await orderService.checkoutAndCreateOrder({
      userId: req.user._id,
      paymentMethod: paymentMethod || "card_sim",
      paymentId,
      paymentLast4,
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.myOrders = async (req, res) => {
  try {
    const orders = await orderService.getMyOrders(req.user._id);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const result = await orderService.cancelMyOrder({
      userId: req.user._id,
      orderId: req.params.id,
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
