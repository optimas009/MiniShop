function onlyDigits(s = "") {
  return String(s).replace(/\D/g, "");
}

function luhnCheck(cardNumber) {
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
}

module.exports = { onlyDigits, luhnCheck };
