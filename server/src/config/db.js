const mongoose = require("mongoose");

// Fail fast instead of buffering operations for 10s when disconnected —
// without this, every /feasibility/generate call would silently hang for
// 10 extra seconds trying to persist before giving up.
mongoose.set("bufferCommands", false);

async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/udyamsaarthi";
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log(`[db] Connected to MongoDB at ${uri}`);
  } catch (err) {
    console.error("[db] MongoDB connection failed:", err.message);
    console.warn("[db] Continuing without persistence — reports will not be saved.");
  }
}

module.exports = { connectDB };
