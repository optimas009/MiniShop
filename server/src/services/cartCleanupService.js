const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

/**
 * Transactionally release one expired cart.
 *
 * Re-checking status + expiry inside the transaction makes this idempotent
 * across overlapping serverless requests, cron invocations, and cart reads.
 */
async function cleanupExpiredCartById(cartId, now = new Date()) {
  const session = await mongoose.startSession();
  let transactionResult = { cleaned: false, releasedUnits: 0 };

  try {
    await session.withTransaction(async () => {
      const cart = await Cart.findOne({
        _id: cartId,
        status: "active",
        expiresAt: { $lt: now },
      }).session(session);

      if (!cart) {
        transactionResult = { cleaned: false, releasedUnits: 0 };
        return;
      }

      let units = 0;

      for (const item of cart.items) {
        const qty = Number(item.qty || 0);
        if (qty <= 0) continue;

        const result = await Product.updateOne(
          { _id: item.product, reserved: { $gte: qty } },
          { $inc: { reserved: -qty } },
          { session }
        );

        if (result.modifiedCount === 1) units += qty;
      }

      cart.items = [];
      cart.status = "expired";
      await cart.save({ session });

      // MongoDB may retry the transaction callback, so assign rather than
      // increment counters inside the callback.
      transactionResult = { cleaned: true, releasedUnits: units };
    });

    return transactionResult;
  } finally {
    await session.endSession();
  }
}

/**
 * Release reservations from a bounded batch of expired carts.
 */
async function cleanupExpiredCarts({ limit = 100 } = {}) {
  const now = new Date();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 500));

  const expiredIds = await Cart.find({
    status: "active",
    expiresAt: { $lt: now },
  })
    .select("_id")
    .limit(safeLimit)
    .lean();

  let cleaned = 0;
  let releasedUnits = 0;

  for (const entry of expiredIds) {
    try {
      const result = await cleanupExpiredCartById(entry._id, now);
      if (result.cleaned) {
        cleaned += 1;
        releasedUnits += result.releasedUnits;
      }
    } catch (err) {
      // One bad/conflicting cart should not stop the remaining batch.
      console.error(`Cart cleanup failed for ${entry._id}:`, err.message);
    }
  }

  return {
    scanned: expiredIds.length,
    cleaned,
    releasedUnits,
    hasMore: expiredIds.length === safeLimit,
  };
}

module.exports = {
  cleanupExpiredCartById,
  cleanupExpiredCarts,
};
