const express = require("express");
const userRouter = express.Router();

const { userAuth } = require("../middleware/auth");
const Expense = require("../models/addExpense");
const User = require("../models/User");

// 📊 Get dashboard statistics with flexible date filtering
userRouter.get("/user/dashboard", userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { 
      filterType = 'current_month', // current_month, last_month, current_week, last_week, current_year
      customStartDate,
      customEndDate 
    } = req.query;

    // Calculate date ranges based on filter type
    const dateRange = getDateRange(filterType, customStartDate, customEndDate);

    // Get expense statistics
    const [monthlyStats, weeklyStats, filteredExpenses, categoryBreakdown] = await Promise.all([
      user.getExpenseStatistics('monthly'),
      user.getExpenseStatistics('weekly'),
      getFilteredExpenses(user._id, dateRange),
      getCategoryBreakdown(user._id, dateRange)
    ]);

    // Get recent transactions (always show last 5)
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
      filteredData: {
        filterType,
        dateRange: {
          start: dateRange.startDate,
          end: dateRange.endDate,
          label: dateRange.label
        },
        totalSpent: filteredExpenses.totalSpent,
        expenseCount: filteredExpenses.count,
        expenses: filteredExpenses.expenses
      },
      categoryBreakdown,
      recentExpenses
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to get date ranges
function getDateRange(filterType, customStartDate, customEndDate) {
  const now = new Date();
  let startDate, endDate, label;

  switch (filterType) {
    case 'current_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      label = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      break;

    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      label = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      break;

    case 'current_week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      label = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      break;

    case 'last_week':
      const lastWeekEnd = new Date(now);
      lastWeekEnd.setDate(now.getDate() - now.getDay() - 1); // Last Saturday
      lastWeekEnd.setHours(23, 59, 59, 999);
      startDate = new Date(lastWeekEnd);
      startDate.setDate(lastWeekEnd.getDate() - 6); // Last Sunday
      startDate.setHours(0, 0, 0, 0);
      endDate = lastWeekEnd;
      label = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      break;

    case 'current_year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      label = now.getFullYear().toString();
      break;

    case 'last_year':
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      label = (now.getFullYear() - 1).toString();
      break;

    case 'custom':
      if (customStartDate && customEndDate) {
        startDate = new Date(customStartDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
        label = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      } else {
        // Default to current month if custom dates not provided
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        label = 'Current Month';
      }
      break;

    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      label = 'Current Month';
  }

  return { startDate, endDate, label };
}

// Helper function to get filtered expenses
async function getFilteredExpenses(userId, dateRange) {
  const expenses = await Expense.find({
    userId: userId,
    date: { $gte: dateRange.startDate, $lte: dateRange.endDate }
  }).sort({ date: -1 }).lean();

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.price, 0);

  return {
    expenses,
    totalSpent,
    count: expenses.length
  };
}

// Helper function to get category breakdown
async function getCategoryBreakdown(userId, dateRange) {
  return await Expense.aggregate([
    {
      $match: {
        userId: userId,
        date: { $gte: dateRange.startDate, $lte: dateRange.endDate }
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$price' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);
}

// 📜 Get expense list for logged-in user (with optional filtering)
userRouter.get("/user/expenselist", userAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 100 ? 100 : limit;
    const skip = (page - 1) * limit;

    const { filterType, customStartDate, customEndDate } = req.query;
    
    const loggedInUser = req.user;
    let query = { userId: loggedInUser._id };

    // Add date filter if provided
    if (filterType && filterType !== 'all') {
      const dateRange = getDateRange(filterType, customStartDate, customEndDate);
      query.date = { $gte: dateRange.startDate, $lte: dateRange.endDate };
    }

    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const totalExpenses = await Expense.countDocuments(query);

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