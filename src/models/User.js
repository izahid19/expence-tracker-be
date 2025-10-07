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
  },
  dailyExpense: {
    type: Number,
    default: function() {
      // Calculate daily expense as monthly / 30 (average days per month)
      return Math.round(this.monthlyExpense / 30);
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

// Pre-save middleware to update weekly and daily expenses if monthlyExpense changes
userSchema.pre('save', function(next) {
  if (this.isModified('monthlyExpense')) {
    this.weeklyExpense = Math.round(this.monthlyExpense / 4.33);
    this.dailyExpense = Math.round(this.monthlyExpense / 30);
  }
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;