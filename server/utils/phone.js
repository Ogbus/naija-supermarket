// Validates Nigerian phone numbers in either local format (0XXXXXXXXXX, 11 digits)
// or international format (+234XXXXXXXXXX / 234XXXXXXXXXX). Nigerian mobile numbers
// are 11 digits locally, with the second digit typically 7, 8, or 9.
const NIGERIAN_PHONE_REGEX = /^(\+234|234|0)[789][01]\d{8}$/;

function normalizePhone(value) {
  return String(value || '').replace(/[\s\-()]/g, '');
}

function isValidNigerianPhone(value) {
  return NIGERIAN_PHONE_REGEX.test(normalizePhone(value));
}

module.exports = { normalizePhone, isValidNigerianPhone };
