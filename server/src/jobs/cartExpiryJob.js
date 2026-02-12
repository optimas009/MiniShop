const { cleanupExpiredCarts } = require("../services/cartCleanupService");

function startCartExpiryJob() {
  // run once on startup
  cleanupExpiredCarts().catch(() => {});

  // then every 1 minute
  setInterval(() => {
    cleanupExpiredCarts().catch((err) => {
      console.error("Cart cleanup failed:", err.message);
    });
  }, 60 * 1000);
}

module.exports = { startCartExpiryJob };
