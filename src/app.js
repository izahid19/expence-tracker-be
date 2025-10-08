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

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
    "X-CSRF-Token"
  ],
  exposedHeaders: ["Set-Cookie", "Authorization"],
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// app.use(
//   cors({
//     origin: "http://localhost:5173", // your React app URL
//     credentials: true,                // ✅ allow cookies
//   })
// );

app.use(express.json());
app.use(cookieParser());

// ✅ Routes
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", expenseRouter);
app.use("/", userRouter);

// ✅ DB connection + server start
connectDB()
  .then(() => {
    console.log("✅ Database connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on PORT: ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("❌ Something went wrong while connecting to DB:", err);
  });