const mongoose = require("mongoose");
const Validate = require("validator");
const Bycrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 40,
  },
  lastName: { 
    type: String, 
    trim: true, 
    minlength: 3, 
    maxlength: 40 
  },
  emailId: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
    validate(value) {
      if (!Validate.isEmail(value)) {
        throw new Error("invalid email" + value);
      }
    },
  },
  password: { 
    type: String, 
    trim: true,
    validate(value) {
      if (!Validate.isStrongPassword(value)) {
        throw new Error("password cannot contain password" + value);
      }
    } 
  },
  age: { 
    type: Number,
    min: 18,
    max: 100,
    default: 19
  },
  gender: { type: String, trim: true, enum: ["male", "female"], default: "male" },
  profilePicture: {
      type: String,
      trim: true,
      default:
        "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp",
      validate(value) {
        if (!/^https?:\/\/.*\.(jpg|jpeg|png|webp|gif|svg)$/i.test(value)) {
          throw new Error("Invalid image URL: " + value);
        }
      },
  },
  monthlyExpense: {
    type: Number,
    default: 6000,
    min: 0
  },
  weeklyExpense: {
    type: Number,
    default: function() {
      // Calculate weekly expense as monthly / 4.33 (average weeks per month)
      return Math.round(this.monthlyExpense / 4.33);
    },
    min: 0
  }
}, { timestamps: true });

userSchema.methods.getJwtToken = async function() {
  const user = this;
  const token = await jwt.sign({userId: user._id}, "secretKey", {expiresIn: "1d"});
  return token;
}

userSchema.methods.validatePassword = async function(passwordInputByUser) {
  const user = this;
  const hashPassword = user.password; 
  const isPasswordCorrect = await Bycrypt.compare(passwordInputByUser, hashPassword);
  return isPasswordCorrect;
}

// Expense Statistics Methods
userSchema.methods.getExpenseStatistics = async function(period = 'monthly') {
  const userId = this._id;
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case 'weekly':
      startDate = new Date(now.setDate(now.getDate() - now.getDay()));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'monthly':
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
  }

  const Expense = mongoose.model('Expense');
  const totalSpent = await Expense.aggregate([
    {
      $match: {
        userId: userId,
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$price' }
      }
    }
  ]);

  const spent = totalSpent.length > 0 ? totalSpent[0].total : 0;
  const budget = this[`${period}Expense`];
  const remaining = budget - spent;
  const percentageUsed = budget > 0 ? (spent / budget) * 100 : 0;

  return {
    period,
    budget,
    spent,
    remaining,
    percentageUsed: Math.min(percentageUsed, 100),
    isOverBudget: spent > budget
  };
};

userSchema.methods.getCategoryWiseExpenses = async function(period = 'monthly') {
  const userId = this._id;
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case 'weekly':
      startDate = new Date(now.setDate(now.getDate() - now.getDay()));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'monthly':
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
  }

  const Expense = mongoose.model('Expense');
  const categoryExpenses = await Expense.aggregate([
    {
      $match: {
        userId: userId,
        date: { $gte: startDate, $lte: endDate }
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

  return categoryExpenses;
};

// Pre-save middleware to update weekly expense if monthlyExpense changes
userSchema.pre('save', function(next) {
  if (this.isModified('monthlyExpense')) {
    this.weeklyExpense = Math.round(this.monthlyExpense / 4.33);
  }
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;