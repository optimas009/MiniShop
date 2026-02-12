// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    passwordHash: { type: String, required: true },

    role: { type: String, enum: ["admin", "customer"], default: "customer" },

   
    isVerified: { type: Boolean, default: false },

    emailVerifyCode: { type: String, default: null },
    emailVerifyExpires: { type: Date, default: null },
    emailVerifyAttempts: { type: Number, default: 0, min: 0 },
    emailVerifyLastSentAt: { type: Date, default: null },

    resetPasswordCode: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    resetPasswordAttempts: { type: Number, default: 0, min: 0 },
    resetPasswordLastSentAt: { type: Date, default: null },

    cancelMonth: { type: String, default: "" },
    cancelCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
