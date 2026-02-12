require("./config/env");

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");

const apiRoutes = require("./routes/api.routes");
const { startCartExpiryJob } = require("./jobs/cartExpiryJob");

const app = express();

//  Proper CORS setup
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan("dev"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Server running" });
});

app.use("/api", apiRoutes);

(async () => {
  await connectDB();
  startCartExpiryJob();

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () =>
    console.log(`🚀 Server running on port ${PORT}`)
  );
})();
