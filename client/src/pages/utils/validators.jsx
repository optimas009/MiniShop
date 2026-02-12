export const isValidEmail = (email) =>
  /^[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z]{2,}$/.test(String(email || "").trim());

export const hasUppercase = (s) => /[A-Z]/.test(String(s || ""));


export const onlyDigits = (s = "") => String(s || "").replace(/\D/g, "");

export const luhnCheck = (cardNumber) => {
  const digits = onlyDigits(cardNumber);
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let doubleIt = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (doubleIt) {
      d = d * 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    doubleIt = !doubleIt;
  }
  return sum % 10 === 0;
};

export const isValidCvv = (cvv) => /^\d{3,4}$/.test(String(cvv || "").trim());

export const parseExpiry = (exp) => {
  const raw = String(exp || "").trim();
  const m = raw.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return { ok: false, reason: "Expiry must be MM/YY" };

  const mm = parseInt(m[1], 10);
  const yy = parseInt(m[2], 10);

  if (mm < 1 || mm > 12) return { ok: false, reason: "Month must be 01-12" };

  
  const fullYear = 2000 + yy;

  return { ok: true, mm, yy, fullYear };
};

export const isExpiryNotPast = (exp) => {
  const parsed = parseExpiry(exp);
  if (!parsed.ok) return parsed;

  const { mm, fullYear } = parsed;

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1; // 1-12

  if (fullYear < curYear) return { ok: false, reason: "Card has expired" };
  if (fullYear === curYear && mm < curMonth) return { ok: false, reason: "Card has expired" };

  return { ok: true };
};


export const formatCardNumber = (value) => {
  const digits = onlyDigits(value).slice(0, 19);

  
  return digits.replace(/(.{4})/g, "$1 ").trim();
};