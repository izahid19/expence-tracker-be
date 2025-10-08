require('dotenv').config();
const express = require("express");
const connectDB = require("./config/database.js");
const cookieParser = require("cookie-parser");
const { authRouter } = require("./router/auth.js");
const { profileRouter } = require("./router/profile.js");
const { expenseRouter } = require("./router/expense.js");
const { userRouter } = require("./router/user.js");
const cors = require("cors");

const app = express();
const PORT = 7777;

// ✅ Simple CORS Configuration - This is enough!
app.use(cors({
  origin: "https://myexpensetrackerr.vercel.app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

// ✅ Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ✅ Routes
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", expenseRouter);
app.use("/", userRouter);

// ✅ Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ 
    message: "Server is running!", 
    timestamp: new Date().toISOString(),
    cors: "Enabled for http://localhost:5173"
  });
});

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: "Route not found",
    path: req.originalUrl 
  });
});

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  
  res.status(500).json({ 
    message: "Internal Server Error",
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// ✅ Database connection + server start
connectDB()
  .then(() => {
    console.log("✅ Database connected successfully");
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on PORT: ${PORT}`);
      console.log(`🌐 CORS enabled for: http://localhost:5173`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  })
  .catch((err) => {
    console.log("❌ Database connection failed:", err);
    process.exit(1);
  });