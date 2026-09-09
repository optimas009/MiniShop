const Product = require("../models/Product");
const Cart = require("../models/Cart");

exports.createProduct = async (data) => Product.create(data);

exports.getProducts = async () => Product.find().sort({ featured: -1, createdAt: -1 });

exports.getProductById = async (id) => {
  const product = await Product.findById(id);
  if (!product) {
    const err = new Error("Product not found");
    err.status = 404;
    throw err;
  }
  return product;
};

exports.updateProduct = async (id, data) => {
  const updated = await Product.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    const err = new Error("Product not found");
    err.status = 404;
    throw err;
  }
  return updated;
};

exports.deleteProduct = async (id) => {
  const p = await Product.findById(id);
  if (!p) {
    const err = new Error("Product not found");
    err.status = 404;
    throw err;
  }

  const carts = await Cart.find({ "items.product": id }).select("items");
  let totalToRelease = 0;

  for (const c of carts) {
    for (const it of c.items) {
      if (String(it.product) === String(id)) totalToRelease += Number(it.qty || 0);
    }
  }

  if (totalToRelease > 0) {
    await Product.updateOne(
      { _id: id, reserved: { $gte: totalToRelease } },
      { $inc: { reserved: -totalToRelease } }
    );
  }

  await Cart.updateMany(
    { "items.product": id },
    { $pull: { items: { product: id } } }
  );

  return Product.findByIdAndDelete(id);
};
