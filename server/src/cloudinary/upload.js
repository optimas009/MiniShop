const multer = require("multer");

const storage = multer.memoryStorage();

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
    const err = new Error("Only JPG, PNG, WEBP, or AVIF product images are allowed");
    err.status = 400;
    return cb(err);
  }
  cb(null, true);
};

const uploadProductImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 6,
  },
});

module.exports = { uploadProductImages };
