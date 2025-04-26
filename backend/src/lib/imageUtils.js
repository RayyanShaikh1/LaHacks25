import axios from "axios";
import cloudinary from "./cloudinary.js";

// Convert Cloudinary URL to base64 for Gemini
export async function getBase64FromCloudinary(url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const base64 = Buffer.from(response.data, "binary").toString("base64");
    return base64;
  } catch (error) {
    console.error("Error converting Cloudinary URL to base64:", error);
    throw error;
  }
}

// Upload base64 image to Cloudinary
export async function uploadBase64ToCloudinary(base64Data) {
  try {
    // Add data URI prefix if it's not already present
    const dataUri = base64Data.startsWith("data:")
      ? base64Data
      : `data:image/jpeg;base64,${base64Data}`;

    const uploadResponse = await cloudinary.uploader.upload(dataUri, {
      folder: "gemini_images",
    });
    return {
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
    };
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
}

// Delete image from Cloudinary
export async function deleteCloudinaryImage(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw error;
  }
}
