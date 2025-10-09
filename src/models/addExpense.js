// models/Expense.js
const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    name: {
      type: String,
      required: [true, "Expense name is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "Food",
        "Groceries",
        "Transport",
        "Entertainment",
        "Shopping",
        "Health",
        "Bills",
        "Education",
        "Travel",
        "Utilities",
        "Rent",
        "Insurance",
        "Fitness",
        "Gifts",
        "Personal Care",
        "Pet Care",
        "Home Maintenance",
        "Subscriptions",
        "Dining Out",
        "Investment",
        "Savings",
        "Charity",
        "Other",
      ],
      default: "Other",
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for faster queries (user + category)
expenseSchema.index({ userId: 1, category: 1 });

// Validation: name length check
expenseSchema.pre("save", async function (next) {
  if (this.name.length < 2) {
    throw new Error("Expense name must be at least 2 characters long");
  }
  next();
});

const Expense = mongoose.model("Expense", expenseSchema);

module.exports = Expense;