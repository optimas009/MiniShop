
const dotenv = require("dotenv");

dotenv.config(); 

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET,

  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,

  APP_BASE_URL: process.env.APP_BASE_URL,

  CLIENT_URL: process.env.CLIENT_URL,

  BREVO_API_KEY: process.env.BREVO_API_KEY,

  EMAIL_FROM: process.env.EMAIL_FROM,

  CART_TTL_MIN: Number(process.env.CART_TTL_MIN) ,

  MONGODB_URI: process.env.MONGODB_URI,
  
  PORT: process.env.PORT || 5000,
  
};

