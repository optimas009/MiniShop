const axios = require("axios");

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

async function sendVerificationEmail(toEmail, code) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const EMAIL_FROM = process.env.EMAIL_FROM;

  console.log("📨 sending OTP to:", toEmail);
  console.log("📨 from:", EMAIL_FROM);
  console.log("📨 key exists:", !!BREVO_API_KEY);

  const response = await axios.post(
    BREVO_API_URL,
    {
      sender: { name: "MiniShop", email: EMAIL_FROM },
      to: [{ email: toEmail }],
      subject: "Your MiniShop verification code",
      htmlContent: `<h2>Your OTP: ${code}</h2><p>Expires in 5 minutes.</p>`,
    },
    {
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
    }
  );

  console.log("✅ Verification email sent:", response.data);
  return response.data;
}

async function sendResetPasswordEmail(toEmail, code) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const EMAIL_FROM = process.env.EMAIL_FROM;

  const response = await axios.post(
    BREVO_API_URL,
    {
      sender: { name: "MiniShop", email: EMAIL_FROM },
      to: [{ email: toEmail }],
      subject: "MiniShop password reset code",
      htmlContent: `<h2>Your Reset Code: ${code}</h2><p>Expires in 5 minutes.</p>`,
    },
    {
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
    }
  );

  console.log("✅ Reset email sent:", response.data);
  return response.data;
}

module.exports = { sendVerificationEmail, sendResetPasswordEmail };
