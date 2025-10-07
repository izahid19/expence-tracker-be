const express = require("express");
const userRouter = express.Router();

const { userAuth } = require("../middleware/auth");
const Expense = require("../models/addExpense");

// 📜 Get expense list for logged-in user
userRouter.get("/user/expenselist", userAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 100 ? 100 : limit;
    const skip = (page - 1) * limit;

    const loggedInUser = req.user;

    const expenses = await Expense.find({ userId: loggedInUser._id })
      .sort({ date: -1 }) // newest first
      .skip(skip)
      .limit(limit);

    const totalExpenses = await Expense.countDocuments({ userId: loggedInUser._id });

    res.json({
      expenses,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalExpenses / limit),
        totalExpenses,
      },
    });
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

module.exports = { userRouter };
