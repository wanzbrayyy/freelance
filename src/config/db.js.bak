const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
    });
    console.log("✅ MongoDB Connected!");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
};

module.exports = connectDB;
