const Product = require("../models/Product");
const Cart = require("../models/Cart");

exports.createProduct = async (data) => {
  return await Product.create(data);
};

exports.getProducts = async () => {
  return await Product.find().sort({ createdAt: -1 });
};

exports.updateProduct = async (id, data) => {
  const updated = await Product.findByIdAndUpdate(id, data, { new: true });
  if (!updated) {
    const err = new Error("Product not found");
    err.status = 404;
    throw err;
  }
  return updated;
};

exports.deleteProduct = async (id) => {
  // make sure product exists first
  const p = await Product.findById(id);
  if (!p) {
    const err = new Error("Product not found");
    err.status = 404;
    throw err;
  }

  // 1) Find all carts that contain this product
  const carts = await Cart.find({ "items.product": id }).select("items");

  // 2) Calculate how much reserved to release for this product across carts
  let totalToRelease = 0;
  for (const c of carts) {
    for (const it of c.items) {
      if (String(it.product) === String(id)) {
        totalToRelease += Number(it.qty || 0);
      }
    }
  }

  // 3) Release reserved (best effort, prevent negative)
  if (totalToRelease > 0) {
    await Product.updateOne(
      { _id: id, reserved: { $gte: totalToRelease } },
      { $inc: { reserved: -totalToRelease } }
    );
  }

  // 4) Remove that product from all carts and rest items stay
  await Cart.updateMany(
    { "items.product": id },
    { $pull: { items: { product: id } } }
  );

  // 5) Now delete the product
  const deleted = await Product.findByIdAndDelete(id);
  return deleted;
};
