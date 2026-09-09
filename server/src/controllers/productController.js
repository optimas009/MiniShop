const productService = require("../services/productService");
const imageService = require("../cloudinary/imageService");
const { cleanupExpiredCarts } = require("../services/cartCleanupService");

const asNumber = (value, field) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    const err = new Error(`${field} must be a non-negative number`);
    err.status = 400;
    throw err;
  }
  return n;
};

const asBoolean = (value) => value === true || value === "true" || value === "1";

const normalizePayload = (body = {}, partial = false) => {
  const data = {};

  if (!partial || body.name !== undefined) {
    const name = String(body.name || "").trim();
    if (!name) {
      const err = new Error("Product name is required");
      err.status = 400;
      throw err;
    }
    data.name = name;
  }

  if (!partial || body.price !== undefined) data.price = asNumber(body.price, "Price");
  if (!partial || body.stock !== undefined) data.stock = asNumber(body.stock, "Stock");
  if (body.description !== undefined) data.description = String(body.description || "").trim();
  if (body.category !== undefined) data.category = String(body.category || "General").trim() || "General";
  if (body.featured !== undefined) data.featured = asBoolean(body.featured);

  return data;
};

const parseRemoveIds = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return String(value).split(",").map((v) => v.trim()).filter(Boolean);
  }
};

exports.createProduct = async (req, res) => {
  let uploaded = [];
  try {
    const payload = normalizePayload(req.body);
    uploaded = await imageService.uploadProductImages(req.files || []);
    payload.images = uploaded.map((img, index) => ({ ...img, alt: `${payload.name} image ${index + 1}` }));

    const product = await productService.createProduct(payload);
    res.status(201).json(product);
  } catch (err) {
    if (uploaded.length) await imageService.deleteProductImages(uploaded.map((img) => img.publicId));
    res.status(err.status || 400).json({ message: err.message });
  }
};

exports.getProducts = async (_req, res) => {
  try {
    // Serverless-safe lazy cleanup: visitors never see inventory held by
    // already-expired carts, even between scheduled cron runs.
    await cleanupExpiredCarts({ limit: 100 });
    res.json(await productService.getProducts());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    await cleanupExpiredCarts({ limit: 100 });
    res.json(await productService.getProductById(req.params.id));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  let uploaded = [];
  try {
    const current = await productService.getProductById(req.params.id);
    const payload = normalizePayload(req.body, true);
    const removeIds = parseRemoveIds(req.body.removeImagePublicIds);
    const allowedRemoveIds = new Set((current.images || []).map((img) => img.publicId));
    const safeRemoveIds = removeIds.filter((id) => allowedRemoveIds.has(id));

    if (payload.stock !== undefined && payload.stock < Number(current.reserved || 0)) {
      const err = new Error(`Stock cannot be lower than the ${current.reserved || 0} units currently reserved in carts`);
      err.status = 400;
      throw err;
    }

    uploaded = await imageService.uploadProductImages(req.files || []);

    const remainingImages = (current.images || [])
      .filter((img) => !safeRemoveIds.includes(img.publicId))
      .map((img) => img.toObject ? img.toObject() : img);

    const productName = payload.name || current.name;
    const slots = Math.max(0, 6 - remainingImages.length);
    const acceptedUploads = uploaded.slice(0, slots);
    const overflowUploads = uploaded.slice(slots);
    if (overflowUploads.length) {
      await imageService.deleteProductImages(overflowUploads.map((img) => img.publicId));
      uploaded = acceptedUploads;
      const err = new Error("A product can have at most 6 images");
      err.status = 400;
      throw err;
    }

    const newImages = acceptedUploads.map((img, index) => ({
      ...img,
      alt: `${productName} image ${remainingImages.length + index + 1}`,
    }));

    if (safeRemoveIds.length || newImages.length) {
      payload.images = [...remainingImages, ...newImages];
    }

    const updated = await productService.updateProduct(req.params.id, payload);
    if (safeRemoveIds.length) await imageService.deleteProductImages(safeRemoveIds);

    res.json(updated);
  } catch (err) {
    if (uploaded.length) await imageService.deleteProductImages(uploaded.map((img) => img.publicId));
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const current = await productService.getProductById(req.params.id);
    const publicIds = (current.images || []).map((img) => img.publicId);
    const deleted = await productService.deleteProduct(req.params.id);
    await imageService.deleteProductImages(publicIds);
    res.json({ ok: true, deletedId: deleted._id });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
