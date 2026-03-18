function createStore() {
  return new Map();
}

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function cleanupStore(store, now) {
  for (const [key, value] of store.entries()) {
    if (value.resetAt <= now) {
      store.delete(key);
    }
  }
}

function buildKey(req, keyPrefix) {
  return `${keyPrefix}:${getClientIp(req)}`;
}

export function createRateLimiter({
  windowMs = 60_000,
  max = 100,
  keyPrefix = "global",
} = {}) {
  const store = createStore();

  return function rateLimiter(req, res, next) {
    const now = Date.now();
    cleanupStore(store, now);

    const key = buildKey(req, keyPrefix);
    const current = store.get(key);
    if (!current || current.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;
    if (current.count > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      res.set("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({ message: "Too many requests. Please retry shortly." });
    }

    return next();
  };
}
