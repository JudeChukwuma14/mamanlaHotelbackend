const dns = require("node:dns");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore in environments where setting DNS servers is restricted
}

const mongoose = require("mongoose");
const ENV = require("./env");

const connectDB = async (customUri) => {
  try {
    const uri = customUri || ENV.mongodb_url;
    const db = await mongoose.connect(uri);
    console.log(`DB connected at ${db.connection.host}`);
    return db;
  } catch (error) {
    console.error("DB Error:", error.message);
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
  } catch (error) {
    console.error("DB Disconnect Error:", error.message);
  }
};

module.exports = connectDB;
module.exports.disconnectDB = disconnectDB;
