require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
const { errorHandler } = require("./middlewares/errorHandler");

const authRoutes = require("./routes/authRoutes");
const financeRoutes = require("./routes/financeRoutes");
const feasibilityRoutes = require("./routes/feasibilityRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok", service: "udyamsaarthi-server" }));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/finance", financeRoutes);
app.use("/api/v1/feasibility", feasibilityRoutes);

app.use(errorHandler);

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[server] UdyamSaarthi-AI orchestration API listening on port ${PORT}`);
  });
}

start();

module.exports = app;
