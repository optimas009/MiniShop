const Cart = require("../models/Cart");
const Product = require("../models/Product");

async function cleanupExpiredCarts() {
  const now = new Date();

  const expiredCarts = await Cart.find({
    status: "active",
    expiresAt: { $lt: now },
  });

  for (const cart of expiredCarts) {
    for (const item of cart.items) {
      await Product.updateOne(
        { _id: item.product, reserved: { $gte: item.qty } },
        { $inc: { reserved: -item.qty } }
      );
    }

    cart.items = [];
    cart.status = "expired";
    await cart.save();
  }
}

module.exports = {
  cleanupExpiredCarts,
};
