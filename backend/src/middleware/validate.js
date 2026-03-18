function respondValidationError(res, message) {
  return res.status(400).json({ message });
}

export function isNonEmptyString(value, { min = 1, max = 500 } = {}) {
  return typeof value === "string" && value.trim().length >= min && value.trim().length <= max;
}

export function isEmail(value) {
  if (!isNonEmptyString(value, { min: 3, max: 254 })) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isSafeId(value, max = 120) {
  return typeof value === "string" && /^[a-zA-Z0-9._:-]+$/.test(value) && value.length <= max;
}

export function asTrimmedString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

export function validatePaginationLimit(value, { min = 1, max = 100, defaultValue = 20 } = {}) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return defaultValue;
  }
  return Math.max(min, Math.min(parsed, max));
}

export function requireFields(fields) {
  return (req, res, next) => {
    for (const field of fields) {
      if (req.body?.[field] === undefined || req.body?.[field] === null) {
        return respondValidationError(res, `${field} is required.`);
      }
    }
    return next();
  };
}
