const express = require("express");
const profileRouter = express.Router();
const { userAuth } = require("../middleware/auth");
const { validateEditProfileData } = require("../utils/validation");

profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (err) {
    res.status(400).send("Error: " + err);
  }
});

profileRouter.patch("/profile/update", userAuth, async (req, res) => {
  try {
    // Validate the data (should throw error if invalid)
    validateEditProfileData(req);
    
    const loggedInUser = req.user;

    console.log("what is logged in user", loggedInUser);
    
    // Whitelist allowed fields based on your schema
    const ALLOWED_UPDATES = [
      'firstName', 
      'lastName', 
      'age', 
      'gender', 
      'profilePicture', 
    ];
    
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => ALLOWED_UPDATES.includes(update));
    
    if (!isValidOperation) {
      return res.status(400).json({ error: "Invalid updates - some fields are not allowed" });
    }
    
    // Apply updates
    updates.forEach(key => loggedInUser[key] = req.body[key]);
    
    await loggedInUser.save();

    res.json({ 
      message: "Profile updated successfully", 
      data: loggedInUser 
    });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to update profile" });
  }
});

module.exports = { profileRouter };
