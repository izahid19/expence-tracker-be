const express = require("express");
const profileRouter = express.Router();
const { userAuth } = require("../middleware/auth");
const { validateEditProfileData } = require("../utils/validation");

// Helper function to sanitize user data
const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  
  const { password, updatedAt, __v, ...sanitized } = userObj;
  return sanitized;
};

profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      message: "Profile fetched successfully",
      data: sanitizeUser(user)
    });
  } catch (err) {
    res.status(400).json({ 
      error: "Error fetching profile: " + err.message 
    });
  }
});

profileRouter.put("/profile/update", userAuth, async (req, res) => {
  try {
    // Validate the data (should throw error if invalid)
    validateEditProfileData(req);
    
    const loggedInUser = req.user;
    
    // Define allowed fields for update
    const ALLOWED_UPDATES = [
      'firstName', 
      'lastName', 
      'age', 
      'gender', 
      'profilePicture',
      'monthlyExpense',
    ];
    
    const payload = req.body;
    
    // Check for invalid keys
    const invalidKeys = Object.keys(payload).filter(
      key => !ALLOWED_UPDATES.includes(key)
    );
    
    if (invalidKeys.length > 0) {
      return res.status(400).json({ 
        error: `Invalid fields: ${invalidKeys.join(", ")}` 
      });
    }
    
    // Apply updates - only update fields that are provided
    Object.keys(payload).forEach(key => {
      if (ALLOWED_UPDATES.includes(key)) {
        loggedInUser[key] = payload[key];
      }
    });
    
    await loggedInUser.save();

    res.json({ 
      message: "Profile updated successfully", 
      data: sanitizeUser(loggedInUser)
    });
  } catch (err) {
    res.status(400).json({ 
      error: err.message || "Failed to update profile" 
    });
  }
});

module.exports = { profileRouter };