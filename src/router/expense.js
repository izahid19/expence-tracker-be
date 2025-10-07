const express = require("express");
const expenseRouter = express.Router();
const { userAuth } = require("../middleware/auth");
const Expense = require("../models/addExpense");

// ✅ Add new expense
expenseRouter.post("/user/addexpense", userAuth, async (req, res) => {
  try {
    const userId = req.user._id; // automatically from auth middleware
    const { name, price, category, date } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Name and price are required" });
    }

    const newExpense = new Expense({
      userId,
      name,
      price,
      category: category || "Other",
      date: date || Date.now(),
    });

    await newExpense.save();

    res.status(201).json({
      message: "Expense added successfully",
      data: newExpense,
    });
  } catch (err) {
    console.error("Error adding expense:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 🗑️ Delete expense
expenseRouter.delete("/user/deleteexpense/:expenseId", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { expenseId } = req.params;

    const deletedExpense = await Expense.findOneAndDelete({
      _id: expenseId,
      userId,
    });

    if (!deletedExpense) {
      return res.status(404).json({ message: "Expense not found or unauthorized" });
    }

    res.status(200).json({
      message: "Expense deleted successfully",
      data: deletedExpense,
    });
  } catch (err) {
    console.error("Error deleting expense:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = { expenseRouter };
