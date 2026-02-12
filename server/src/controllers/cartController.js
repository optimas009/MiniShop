const Cart = require("../models/Cart");
const Product = require("../models/Product");

const CART_TTL_MIN = Number(process.env.CART_TTL_MIN);

const newExpiry = () => new Date(Date.now() + CART_TTL_MIN * 60 * 1000);

async function releaseCartReserved(cart) {
  if (!cart || !cart.items?.length) return;

  for (const it of cart.items) {
    await Product.updateOne(
      { _id: it.product, reserved: { $gte: it.qty } },
      { $inc: { reserved: -it.qty } }
    );
  }
}

async function removeDeletedProductsFromCart(cart) {
  if (!cart || !cart.items?.length) return 0;

  const ids = cart.items.map((it) => it.product);

  // which products still exist
  const existing = await Product.find({ _id: { $in: ids } }).select("_id");
  const existSet = new Set(existing.map((p) => String(p._id)));

  // items whose product was deleted
  const removedItems = cart.items.filter((it) => !existSet.has(String(it.product)));
  if (!removedItems.length) return 0;

  // release reserved for removed items (best effort)
  for (const it of removedItems) {
    const qty = Number(it.qty || 0);
    if (qty > 0) {
      await Product.updateOne(
        { _id: it.product, reserved: { $gte: qty } },
        { $inc: { reserved: -qty } }
      );
    }
  }

  // remove them from cart
  cart.items = cart.items.filter((it) => existSet.has(String(it.product)));
  await cart.save();

  return removedItems.length;
}




exports.getMyCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) return res.json({ items: [], expiresAt: null });

    // if expired -> auto clear + release
    if (cart.status === "active" && cart.expiresAt < new Date()) {
      await releaseCartReserved(cart);
      cart.items = [];
      cart.status = "expired";
      await cart.save();
      return res.json({ items: [], expiresAt: null });
    }

    // remove deleted products from cart rest stays
    await removeDeletedProductsFromCart(cart);


    const populated = await Cart.findById(cart._id).populate(
      "items.product",
      "name price stock reserved"
    );

    return res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



exports.addItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, qty } = req.body;

    const qtyInt = parseInt(qty, 10);
    if (!productId || !qtyInt || qtyInt < 1) {
      return res.status(400).json({ message: "Invalid product/qty" });
    }

    // 1) Ensure cart exists
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({
        user: userId,
        items: [],
        status: "active",
        expiresAt: newExpiry(),
      });
    }

    // 2) If cart expired -> release reserved + clear
    if (cart.status === "active" && cart.expiresAt < new Date()) {
      await releaseCartReserved(cart);
      cart.items = [];
    }

    // find existing qty in cart

    const idx = cart.items.findIndex((i) => String(i.product) === String(productId));
    const currentQty = idx >= 0 ? cart.items[idx].qty : 0;
    const addQty = qtyInt;

    // We are reserving ONLY the delta (addQty)

    // 3) ATOMIC reserve on Product no overselling

    const reservedRes = await Product.updateOne(
      {
        _id: productId,
        $expr: {
          $gte: [
            { $subtract: ["$stock", { $ifNull: ["$reserved", 0] }] },
            addQty
          ]
        }
      },
      { $inc: { reserved: addQty } }
    );


    if (reservedRes.modifiedCount !== 1) {
      return res.status(400).json({ message: "Not enough stock available" });
    }

    // 4) Update cart after reserve
    // If cart save fails, rollback reserved
    try {
      const p = await Product.findById(productId).select("price name");

      if (!p) {



        await Product.updateOne({ _id: productId }, { $inc: { reserved: -addQty } });
        return res.status(404).json({ message: "Product not found" });
      }

      if (idx >= 0) {
        cart.items[idx].qty = currentQty + addQty;
        cart.items[idx].priceSnapshot = p.price;
      } else {
        cart.items.push({
          product: productId,
          qty: addQty,
          priceSnapshot: p.price,
        });
      }

      cart.status = "active";
      cart.expiresAt = newExpiry(); // reset timer on add
      await cart.save();

      return res.json({ ok: true });

    } catch (err2) {

      // rollback reserved if cart update fails

      await Product.updateOne({ _id: productId }, { $inc: { reserved: -addQty } });
      throw err2;
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.removeItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, qty } = req.body;

    let cart = await Cart.findOne({ user: userId });
    if (!cart) return res.json({ ok: true });

    // expired -> release all
    if (cart.status === "active" && cart.expiresAt < new Date()) {
      await releaseCartReserved(cart);
      cart.items = [];
      cart.status = "expired";
      await cart.save();
      return res.json({ ok: true });
    }

    const idx = cart.items.findIndex((i) => String(i.product) === String(productId));
    if (idx < 0) return res.json({ ok: true });

    const currentQty = cart.items[idx].qty;


    let qtyInt = qty === undefined || qty === null ? null : parseInt(qty, 10);
    if (!qtyInt || Number.isNaN(qtyInt) || qtyInt <= 0) qtyInt = currentQty;

    const removeQty = Math.min(currentQty, qtyInt);

    // update cart
    cart.items[idx].qty = currentQty - removeQty;
    if (cart.items[idx].qty <= 0) cart.items.splice(idx, 1);

    cart.expiresAt = newExpiry();
    await cart.save();

    //  Prevent reserved going negative
    await Product.updateOne(
      { _id: productId, reserved: { $gte: removeQty } },
      { $inc: { reserved: -removeQty } }
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.clearMyCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.json({ ok: true });

    await releaseCartReserved(cart);

    cart.items = [];
    cart.status = "expired";
    cart.expiresAt = newExpiry();
    await cart.save();

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
