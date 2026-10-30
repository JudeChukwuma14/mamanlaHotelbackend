const dns = require("node:dns")
dns.setServers(["8.8.8.8", "1.1.1.1"])
const mongoose = require("mongoose")
const ENV = require("./env")


const connectDB = async () => {
    try {
        const DB = await mongoose.connect(ENV.mongodb_url)
        console.log(`DB connected at ${DB.connection.host}`)
    } catch (error) {
        console.error("DB Error", error.message)
    }
}

module.exports = connectDB