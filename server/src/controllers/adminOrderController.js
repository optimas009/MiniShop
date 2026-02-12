const orderService = require("../services/orderService");

exports.listOrders = async (req, res) => {
  try {
    const { status } = req.query; 
    const orders = await orderService.adminListOrders({ status });
    res.json(orders);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const orderId = req.params.id;

    
    const nextStatus = req.body?.nextStatus || req.body?.status;

    if (!nextStatus) {
      return res.status(400).json({ message: "nextStatus is required" });
    }

    const order = await orderService.adminUpdateStatus({ orderId, nextStatus });
    res.json(order);
    
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
