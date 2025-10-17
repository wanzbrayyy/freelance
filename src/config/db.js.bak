const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 20000, // ⬅️ 20 detik timeout
  socketTimeoutMS: 45000, // ⬅️ pastikan koneksi nggak cepat putus
})
.then(() => console.log("✅ MongoDB Connected!"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));
