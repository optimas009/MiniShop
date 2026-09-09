const cloudinary = require("./config");

const PRODUCT_FOLDER = process.env.CLOUDINARY_PRODUCT_FOLDER || "minishop/products";

const uploadBuffer = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: PRODUCT_FOLDER,
        resource_type: "image",
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });

exports.uploadProductImages = async (files = []) => {
  if (!files.length) return [];

  const uploaded = [];
  try {
    for (const file of files) {
      const result = await uploadBuffer(file.buffer);
      uploaded.push({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      });
    }
    return uploaded;
  } catch (error) {
    await Promise.allSettled(uploaded.map((img) => cloudinary.uploader.destroy(img.publicId)));
    throw error;
  }
};

exports.deleteProductImages = async (publicIds = []) => {
  const ids = [...new Set((publicIds || []).filter(Boolean))];
  if (!ids.length) return;
  await Promise.allSettled(ids.map((publicId) => cloudinary.uploader.destroy(publicId)));
};
