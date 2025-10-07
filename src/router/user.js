const express = require("express");
const userRouter = express.Router();

const { userAuth } = require("../middleware/auth");
const Expense = require("../models/addExpense");
const User = require("../models/User"); // Make sure to import User model

// 📊 Get dashboard statistics (monthly & weekly)
userRouter.get("/user/dashboard", userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const period = req.query.period || 'monthly';

    // Get expense statistics for monthly and weekly periods
    const [monthlyStats, weeklyStats, categoryBreakdown] = await Promise.all([
      user.getExpenseStatistics('monthly'),
      user.getExpenseStatistics('weekly'),
      user.getCategoryWiseExpenses(period)
    ]);

    // Get recent transactions
    const recentExpenses = await Expense.find({ userId: user._id })
      .sort({ date: -1 })
      .limit(5)
      .lean();

    res.json({
      user: {
        firstName: user.firstName,
        monthlyExpense: user.monthlyExpense,
        weeklyExpense: user.weeklyExpense
      },
      statistics: {
        monthly: monthlyStats,
        weekly: weeklyStats
      },
      categoryBreakdown,
      recentExpenses
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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