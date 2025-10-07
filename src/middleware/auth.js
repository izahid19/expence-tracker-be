const jwt = require("jsonwebtoken");
const User = require("../models/User.js");

const userAuth = async (req, res, next) => {
  console.log("what is cookies",req.cookies);
  try{
    const cookie = req.cookies;
    const {token} = cookie;
    if(!token){
      return res.status(401).send("please login first");
    }
    const decoded = jwt.verify(token, "secretKey");
    const user = await User.findById(decoded.userId);
    req.user = user;
    next();
  }
  catch(err){
    res.status(400).send("Error: " + err.message);
  }
}

module.exports = { userAuth };