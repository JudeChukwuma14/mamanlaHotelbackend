const cloudinary = require("../config/cloudinary");
const ENV = require("../config/env");

const uploadImage = (fileBuffer, folder = "mamala-hotel/rooms") => {
  return new Promise((resolve, reject) => {
    // Graceful fallback if Cloudinary credentials are not configured yet
    if (!ENV.cloudinary_cloud_name || !ENV.cloudinary_api_key) {
      console.warn("[CloudinaryService] Warning: Cloudinary credentials not configured. Using placeholder URL.");
      const mockId = `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      return resolve({
        url: `https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80`,
        publicId: mockId
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          { width: 1400, crop: "limit", quality: "auto", fetch_format: "auto" }
        ]
      },
      (error, result) => {
        if (error) {
          return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

const deleteImage = async (publicId) => {
  if (!ENV.cloudinary_cloud_name || !ENV.cloudinary_api_key || publicId.startsWith("mock-")) {
    return { result: "ok" };
  }
  return cloudinary.uploader.destroy(publicId);
};

const deleteMultipleImages = async (publicIds) => {
  if (!Array.isArray(publicIds) || publicIds.length === 0) return [];
  return Promise.all(publicIds.map((id) => deleteImage(id)));
};

module.exports = {
  uploadImage,
  deleteImage,
  deleteMultipleImages
};

