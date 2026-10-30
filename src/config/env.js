

require("dotenv").config()


const ENV = {
    port : process.env.PORT,
    mongodb_url: process.env.MONGODB_URL

}

module.exports = ENV