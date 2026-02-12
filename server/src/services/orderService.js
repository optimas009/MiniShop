const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

const currentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

async function ensureCancelCounterFresh(userId, session) {
  const month = currentMonthKey();

  const user = await User.findById(userId).session(session || null);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  if (user.cancelMonth !== month) {
    user.cancelMonth = month;
    user.cancelCount = 0;
    await user.save({ session });
  }

  return user;
}

exports.checkoutAndCreateOrder = async ({ userId, paymentMethod, paymentId, paymentLast4 }) => {

  const session = await mongoose.startSession();

  try {
    let createdOrder;

    await session.withTransaction(async () => {
      //payment validation FIRST
      const method = paymentMethod || "card_sim";

      if (method === "card_sim") {
        if (!paymentId) {
          const err = new Error("Payment required. Please complete payment simulation first.");
          err.status = 400;
          throw err;
        }
      } else if (method === "cod") {
        

      } else {
        const err = new Error("Invalid payment method");
        err.status = 400;
        throw err;
      }

      // 1) cancel limit 
      const user = await ensureCancelCounterFresh(userId, session);
      if (user.cancelCount >= 5) {
        const err = new Error("Order blocked for this month due to too many cancellations");
        err.status = 403;
        throw err;
      }

      // 2) cart must be active and not expired
      const cart = await Cart.findOne({ user: userId }).session(session);
      if (!cart || cart.status !== "active" || cart.items.length === 0) {
        const err = new Error("Cart is empty");
        err.status = 400;
        throw err;
      }
      if (cart.expiresAt && cart.expiresAt < new Date()) {
        const err = new Error("Cart expired");
        err.status = 400;
        throw err;
      }

      // 3) build order items + total from Product
      const orderItems = [];
      let total = 0;

      for (const ci of cart.items) {
        const p = await Product.findById(ci.product).session(session);
        if (!p) {
          const err = new Error("Product not found in cart");
          err.status = 404;
          throw err;
        }

        const qty = Number(ci.qty || 0);
        if (qty <= 0) {
          const err = new Error("Invalid qty in cart");
          err.status = 400;
          throw err;
        }

        if ((p.reserved || 0) < qty) {
          const err = new Error(`Reserved stock mismatch for ${p.name}`);
          err.status = 400;
          throw err;
        }

        if ((p.stock || 0) < qty) {
          const err = new Error(`Not enough stock for ${p.name}`);
          err.status = 400;
          throw err;
        }

        orderItems.push({
          product: p._id,
          nameSnapshot: p.name,
          priceSnapshot: p.price,
          qty,
        });

        total += p.price * qty;
      }

      total = Math.round(total * 100) / 100;

      // 4) deduct stock + reserved (inside txn)
      for (const item of orderItems) {
        const qty = item.qty;

        const r = await Product.updateOne(
          { _id: item.product, stock: { $gte: qty }, reserved: { $gte: qty } },
          { $inc: { stock: -qty, reserved: -qty } },
          { session }
        );

        if (r.modifiedCount !== 1) {
          const err = new Error("Stock update failed (concurrent update). Try again.");
          err.status = 409;
          throw err;
        }
      }

      // 5) create order (inside txn)
      const created = await Order.create(
        [
          {
            user: userId,
            items: orderItems,
            total,

            paymentMethod: method,
            paymentId: paymentId || null,
            paymentLast4: paymentLast4 || null,
            paymentStatus: method === "cod" ? "pending" : "paid",

            status: "pending",
          },
        ],
        { session }
      );

      createdOrder = created[0];

      // 6) clear cart (inside txn)
      cart.items = [];
      cart.status = "checked_out";
      cart.expiresAt = new Date();
      await cart.save({ session });
    });

    return createdOrder;
  } finally {
    await session.endSession();
  }
};


exports.getMyOrders = async (userId) => {
  return await Order.find({ user: userId }).sort({ createdAt: -1 });
};

exports.cancelMyOrder = async ({ userId, orderId }) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const user = await ensureCancelCounterFresh(userId, session);

      const order = await Order.findOne({ _id: orderId, user: userId }).session(session);
      if (!order) {
        const err = new Error("Order not found");
        err.status = 404;
        throw err;
      }

      if (order.status !== "pending") {
        const err = new Error("You can cancel only pending orders");
        err.status = 400;
        throw err;
      }

      //  restore stock
      for (const it of order.items) {
        const qty = Number(it.qty || 0);
        if (qty > 0) {
          await Product.updateOne({ _id: it.product }, { $inc: { stock: qty } }, { session });
        }
      }

      // fraud prevention
      user.cancelCount += 1;
      await user.save({ session });

      // cancel order
      order.status = "cancelled";
      order.cancelledAt = new Date();

      // refund simulation
      if (order.paymentStatus === "paid") {
        order.paymentStatus = "refunded";
        order.refundedAt = new Date();
        order.refundId = order.refundId || `SIM_REFUND_${order._id.toString().slice(-6).toUpperCase()}`;

      } else if (order.paymentStatus === "pending") {
        
        order.paymentStatus = "unpaid";
      }

      await order.save({ session });

      result = {
        ok: true,
        cancelCount: user.cancelCount,
        paymentStatus: order.paymentStatus,
        refundId: order.refundId || null,
      };
    });

    return result;
  } finally {
    await session.endSession();
  }
};

// ============== ADMIN ==============

exports.adminListOrders = async ({ status }) => {
  const filter = {};
  if (status) filter.status = status;

  return await Order.find(filter)
    .populate("user", "name email role")
    .sort({ createdAt: -1 });
};

exports.adminUpdateStatus = async ({ orderId, nextStatus }) => {
  if (!nextStatus) {
    const err = new Error("nextStatus is required");
    err.status = 400;
    throw err;
  }

  const order = await Order.findById(orderId).populate("user", "name email role");
  if (!order) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }

  const curr = order.status;

  if (curr === "cancelled") {
    const err = new Error("Cancelled orders cannot be updated");
    err.status = 400;
    throw err;
  }

  if (curr === "delivered") {
    const err = new Error("Delivered orders cannot be updated");
    err.status = 400;
    throw err;
  }

  
  const allowed = {
    pending: ["shipped"],
    shipped: ["delivered"],
  };

  if (!allowed[curr] || !allowed[curr].includes(nextStatus)) {
    const err = new Error(`Invalid status transition: ${curr} -> ${nextStatus}`);
    err.status = 400;
    throw err;
  }

  order.status = nextStatus;
  if (nextStatus === "shipped") order.shippedAt = new Date();
  if (nextStatus === "delivered") order.deliveredAt = new Date();

  await order.save();
  return order;
};
