const { v2: cloudinary } = require("cloudinary");
const ENV = require("./env");

cloudinary.config({
  cloud_name: ENV.cloudinary_cloud_name,
  api_key: ENV.cloudinary_api_key,
  api_secret: ENV.cloudinary_api_secret
});

module.exports = cloudinary;

