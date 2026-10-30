const express = require('express')
const helmet = require("helmet")
const cors = require("cors")
const ENV = require('./src/config/env')
const connectDB = require('./src/config/db')
const app = express()


app.use(cors())
app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))


const startServer = async () => {
    await connectDB()
    app.listen(ENV.port, () => {
        console.log(`Server is active on port ${ENV.port}`)
    })
}

startServer()

