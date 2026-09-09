const { cleanupExpiredCarts } = require("../services/cartCleanupService");

function startCartExpiryJob() {
  // Vercel uses short-lived/serverless compute. Never rely on an in-process
  // timer there; production cleanup is handled by request-time cleanup plus
  // the /api/cron/cart-expiry endpoint.
  if (process.env.VERCEL) {
    console.log("Vercel detected: in-process cart cleanup timer disabled");
    return null;
  }

  // Local / traditional always-on Node hosting can keep the convenient timer.
  cleanupExpiredCarts({ limit: 500 }).catch((err) => {
    console.error("Initial cart cleanup failed:", err.message);
  });

  const timer = setInterval(() => {
    cleanupExpiredCarts({ limit: 500 }).catch((err) => {
      console.error("Cart cleanup failed:", err.message);
    });
  }, 60 * 1000);

  // Do not keep Node alive solely because of this maintenance timer.
  if (typeof timer.unref === "function") timer.unref();

  return timer;
}

module.exports = { startCartExpiryJob };
