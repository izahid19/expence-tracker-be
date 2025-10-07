
const mongoose = require("mongoose")

const env = process.env

const connectDB = async () => {
    await mongoose.connect(env.DB_URL);
}

module.exports = connectDB;