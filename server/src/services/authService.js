const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { generateToken } = require("./tokenService");

const { sendVerificationEmail, sendResetPasswordEmail } = require("../email/sendEmail");
const { hasMxRecord, generateOtpCode, hashOtp } = require("../helpers/token.helper");
const { validatePassword } = require("../helpers/password.helper");

/* ===================== CONSTANTS ===================== */
const EMAIL_VERIFY_EXPIRES_MS = 5 * 60 * 1000; // 5 min
const EMAIL_VERIFY_MAX_ATTEMPTS = 5;
const EMAIL_VERIFY_RESEND_COOLDOWN_MS = 30 * 1000; // 30 sec

const RESET_EXPIRES_MS = 5 * 60 * 1000; // 5 min
const RESET_MAX_ATTEMPTS = 5;
const RESET_RESEND_COOLDOWN_MS = 30 * 1000; // 30 sec

const EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z]{2,}$/;

function makeErr(message, status = 400, extra = {}) {
  const err = new Error(message);
  err.status = status;
  Object.assign(err, extra);
  return err;
}

async function safeSend(fn, label) {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    const status = e?.response?.status;
    const data = e?.response?.data;
    console.error(`❌ ${label} FAILED`, { status, data, message: e?.message });
    return { ok: false, status, data, message: e?.message };
  }
}

/* ===================== REGISTER (CUSTOMER) ===================== */
async function registerCustomer({ name, email, password }) {
  name = (name || "").trim();
  email = (email || "").trim().toLowerCase();

  if (!name || !email || !password) throw makeErr("All fields required", 400);

  
  if (name.length < 2) throw makeErr("Name must be at least 2 characters", 400);

  if (!EMAIL_REGEX.test(email)) throw makeErr("Invalid email format", 400);

  const mxOk = await hasMxRecord(email);
  if (!mxOk) throw makeErr("Email domain is not valid", 400);

  const pwError = validatePassword(password);
  if (pwError) throw makeErr(pwError, 400);

  const existing = await User.findOne({ email });
  if (existing) throw makeErr("Email already registered", 409);

  const passwordHash = await bcrypt.hash(password, 10);

  const code = generateOtpCode();
  const hashedCode = hashOtp(code);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: "customer",
    isVerified: false,

    emailVerifyCode: hashedCode,
    emailVerifyExpires: new Date(Date.now() + EMAIL_VERIFY_EXPIRES_MS),
    emailVerifyAttempts: 0,
    emailVerifyLastSentAt: new Date(),

    resetPasswordCode: null,
    resetPasswordExpires: null,
    resetPasswordAttempts: 0,
    resetPasswordLastSentAt: null,
  });

  const mail = await safeSend(
    () => sendVerificationEmail(email, code),
    "SEND_VERIFICATION_EMAIL"
  );

  // Don’t fail registration if email fails; user can "resend code"
  return {
    message: mail.ok
      ? "Registered successfully. Check your email for the verification code."
      : "Registered, but we could not send email right now. Please use 'Resend code'.",
    emailSent: mail.ok,
    user: {
      id: user._id,
      name: user.name,
      role: user.role,
      email: user.email,
      isVerified: user.isVerified,
    },
  };
}

/* ===================== EMAIL VERIFY ===================== */
async function verifyEmailCode({ email, code }) {
  email = (email || "").trim().toLowerCase();
  code = String(code || "").trim();

  if (!email || !code) throw makeErr("Email and code are required", 400);

  const user = await User.findOne({ email });
  if (!user) throw makeErr("Invalid code", 400);

  if (user.isVerified) return { message: "Already verified" };

  if (!user.emailVerifyExpires || user.emailVerifyExpires < new Date()) {
    throw makeErr("Code expired", 400);
  }

  if ((user.emailVerifyAttempts || 0) >= EMAIL_VERIFY_MAX_ATTEMPTS) {
    throw makeErr("Too many attempts. Please request a new code.", 429);
  }

  if (hashOtp(code) !== user.emailVerifyCode) {
    user.emailVerifyAttempts = (user.emailVerifyAttempts || 0) + 1;
    await user.save();
    throw makeErr("Invalid code", 400);
  }

  user.isVerified = true;
  user.emailVerifyCode = null;
  user.emailVerifyExpires = null;
  user.emailVerifyAttempts = 0;
  user.emailVerifyLastSentAt = null;
  await user.save();

  return { message: "Email verified successfully" };
}

/* ===================== RESEND VERIFY CODE ===================== */
async function resendVerificationCode({ email }) {
  email = (email || "").trim().toLowerCase();
  if (!email) throw makeErr("Email required", 400);

  const user = await User.findOne({ email });

  // don’t leak existence
  if (!user) return { message: "If this email exists, a code was sent." };
  if (user.isVerified) return { message: "Already verified" };

  if (user.emailVerifyLastSentAt) {
    const diff = Date.now() - new Date(user.emailVerifyLastSentAt).getTime();
    if (diff < EMAIL_VERIFY_RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((EMAIL_VERIFY_RESEND_COOLDOWN_MS - diff) / 1000);
      throw makeErr(`Please wait ${waitSec}s before requesting another code.`, 429);
    }
  }

  const code = generateOtpCode();
  user.emailVerifyCode = hashOtp(code);
  user.emailVerifyExpires = new Date(Date.now() + EMAIL_VERIFY_EXPIRES_MS);
  user.emailVerifyAttempts = 0;
  user.emailVerifyLastSentAt = new Date();
  await user.save();

  const mail = await safeSend(
    () => sendVerificationEmail(email, code),
    "RESEND_VERIFICATION_EMAIL"
  );

  return {
    message: mail.ok ? "Verification code resent" : "Could not send email now. Try again.",
    emailSent: mail.ok,
  };
}

/* ===================== FORGOT + RESET ===================== */
async function forgotPassword({ email }) {
  email = (email || "").trim().toLowerCase();
  if (!email) throw makeErr("Email required", 400);

  const generic = { message: "If this email exists, a code was sent." };

  const user = await User.findOne({ email });
  if (!user) return generic;

  // If not verified -> resend verification code
  if (!user.isVerified) {
    if (user.emailVerifyLastSentAt) {
      const diff = Date.now() - new Date(user.emailVerifyLastSentAt).getTime();
      if (diff < EMAIL_VERIFY_RESEND_COOLDOWN_MS) {
        throw makeErr("Your email is not verified. Please try again shortly.", 403, {
          reason: "NOT_VERIFIED",
        });
      }
    }

    const code = generateOtpCode();
    user.emailVerifyCode = hashOtp(code);
    user.emailVerifyExpires = new Date(Date.now() + EMAIL_VERIFY_EXPIRES_MS);
    user.emailVerifyAttempts = 0;
    user.emailVerifyLastSentAt = new Date();
    await user.save();

    await safeSend(() => sendVerificationEmail(email, code), "FORGOT->RESEND_VERIFY");

    throw makeErr("Your email is not verified. Verification code sent again.", 403, {
      reason: "NOT_VERIFIED",
    });
  }

  
  if (user.resetPasswordLastSentAt) {
    const diff = Date.now() - new Date(user.resetPasswordLastSentAt).getTime();
    if (diff < RESET_RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((RESET_RESEND_COOLDOWN_MS - diff) / 1000);
      throw makeErr(`Please wait ${waitSec}s before requesting another code.`, 429);
    }
  }

  const code = generateOtpCode();
  user.resetPasswordCode = hashOtp(code);
  user.resetPasswordExpires = new Date(Date.now() + RESET_EXPIRES_MS);
  user.resetPasswordAttempts = 0;
  user.resetPasswordLastSentAt = new Date();
  await user.save();

  await safeSend(() => sendResetPasswordEmail(email, code), "SEND_RESET_EMAIL");

  return generic;
}

async function resetPassword({ email, code, newPassword }) {
  email = (email || "").trim().toLowerCase();
  code = String(code || "").trim();

  if (!email || !code || !newPassword) {
    throw makeErr("Email, code and newPassword are required", 400);
  }

  const pwError = validatePassword(newPassword);
  if (pwError) throw makeErr(pwError, 400);

  const user = await User.findOne({ email });
  if (!user) throw makeErr("Invalid or expired reset code", 400);

  if (!user.resetPasswordCode || !user.resetPasswordExpires) {
    throw makeErr("Invalid or expired reset code", 400);
  }

  if (user.resetPasswordExpires < new Date()) throw makeErr("Invalid or expired reset code", 400);

  if ((user.resetPasswordAttempts || 0) >= RESET_MAX_ATTEMPTS) {
    throw makeErr("Too many attempts. Please request a new code.", 429);
  }

  if (hashOtp(code) !== user.resetPasswordCode) {
    user.resetPasswordAttempts = (user.resetPasswordAttempts || 0) + 1;
    await user.save();
    throw makeErr("Invalid or expired reset code", 400);
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);

  user.resetPasswordCode = null;
  user.resetPasswordExpires = null;
  user.resetPasswordAttempts = 0;
  user.resetPasswordLastSentAt = null;
  await user.save();

  return { message: "Password reset successful. Please login." };
}

/* ===================== LOGIN ===================== */
async function loginByRole({ email, password, role }) {
  email = (email || "").trim().toLowerCase();

  if (!email || !password) throw makeErr("Email and password required", 400);
  if (!EMAIL_REGEX.test(email)) throw makeErr("Invalid email format", 400);

  const user = await User.findOne({ email, role });

  if (!user) throw makeErr("Invalid credentials", 401);

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw makeErr("Invalid credentials", 401);

  if (!user.isVerified) throw makeErr("Please verify your email first", 403);

  const token = generateToken(user);

  return {
    token,
    user: { id: user._id, name: user.name, role: user.role, email: user.email },
  };
}

module.exports = {
  registerCustomer,
  loginByRole,
  verifyEmailCode,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
};
