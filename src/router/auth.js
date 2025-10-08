const express = require("express");
const authRouter = express.Router();
const { validationForSignup, validationForLogin } = require("../utils/validation");
const User = require("../models/User");
const Bycrypt = require("bcrypt");


authRouter.post("/signup", async (req, res) => {
    try {
        await validationForSignup(req);
        const { firstName, lastName, emailId, password } = req.body;
        const enycryptedPassword = await Bycrypt.hash(password, 10);
        const user = new User({ firstName, lastName, emailId, password: enycryptedPassword });
        await user.save();
        res.send("User added sucessfully");
    } catch (err) {
        res.status(400).send("Error: " + err);
    }
});

authRouter.post("/login", async (req, res) => {
    try {
        await validationForLogin(req);
        const { emailId, password } = req.body;
        const user = await User.findOne({ emailId });
        if (!user) {
            throw new Error("User not found" );
        }
        const isPasswordCorrect = await user.validatePassword(password);
        const token = await user.getJwtToken();
        if (!isPasswordCorrect) {
            throw new Error("Invalid password");
        } else {
            res.cookie("token", token, { 
                httpOnly: true,
                secure: false,
                sameSite: "none",
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
             });
            res.json({ message: "Login successful", data: user });
        }
    }
    catch (err) {
        res.status(400).send("Error: " + err);
    }
})

authRouter.post("/logout", async (req, res) => {
    res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    });
    res.send("Logout successful");
})

module.exports = {authRouter};