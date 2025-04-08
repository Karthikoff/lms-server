const cloudinary = require("cloudinary").v2;
require("dotenv").config();
const streamifier = require("streamifier");

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Upload image to Cloudinary (Accepts Base64)
const uploadImageToCloudinary = async (base64String) => {
  try {
    const result = await cloudinary.uploader.upload(base64String, {
      resource_type: "image",
    });
    return result.secure_url; // ✅ Return Cloudinary URL
  } catch (error) {
    console.log("Cloudinary Upload Error:", error);
    throw new Error("Failed to upload image to Cloudinary");
  }
};


// ✅ Upload Large Video to Cloudinary (Stream-based)
const uploadVideoToCloudinary = async (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "video", folder: "course_videos", chunk_size: 6000000 }, // 6MB chunks for large files
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};
module.exports = { uploadImageToCloudinary, uploadVideoToCloudinary };
