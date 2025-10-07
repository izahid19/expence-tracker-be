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
    hobbies: {
      type: [String],
      default: [],
      validate(value) {
        if (value.length > 15) {
          throw new Error("Hobbies cannot contain more than 15 items");
        }
      },
    },
    desc: {
      type: String,
      trim: true,
      default: "",
      validate(value) {
        if (value.trim() === "") return true; // allow empty string

        const wordCount = value.trim().split(/\s+/).length;
        if (wordCount > 400) {
          throw new Error(
            `Description must be less than 400 words. Current word count: ${wordCount}`
          );
        }
      },
    },
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

const User = mongoose.model("User", userSchema);

module.exports = User;
