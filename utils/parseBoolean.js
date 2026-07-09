// Multipart/form-data (checkboxes) sends booleans as strings: "on" when checked,
// and whatever string the frontend explicitly appends (e.g. "false") when unchecked.
// Mongoose's Boolean cast rejects "on", which caused:
//   "Cast to Boolean failed for value \"on\" (type string) at path \"isActive\""
// This normalizes any of those representations into a real boolean.
function parseBoolean(value, fallback = undefined) {
  if (typeof value === 'boolean') return value;
  if (value === undefined || value === null) return fallback;

  const normalized = String(value).trim().toLowerCase();
  if (['true', 'on', '1', 'yes'].includes(normalized)) return true;
  if (['false', 'off', '0', 'no', ''].includes(normalized)) return false;

  return fallback;
}

module.exports = parseBoolean;
