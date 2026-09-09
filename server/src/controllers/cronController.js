const { cleanupExpiredCarts } = require("../services/cartCleanupService");

exports.cleanupExpiredCartReservations = async (req, res) => {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

    // Vercel sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is
    // configured in the project. Require it in production so this maintenance
    // endpoint cannot be abused as a public database scan.
    if (isProduction) {
      if (!cronSecret) {
        return res.status(503).json({
          ok: false,
          message: "CRON_SECRET is not configured",
        });
      }

      if (req.get("authorization") !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ ok: false, message: "Unauthorized" });
      }
    }

    const result = await cleanupExpiredCarts({ limit: 500 });
    return res.json({ ok: true, ...result, ranAt: new Date().toISOString() });
  } catch (err) {
    console.error("Cron cart cleanup failed:", err.message);
    return res.status(500).json({ ok: false, message: "Cart cleanup failed" });
  }
};
