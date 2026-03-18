export function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader("X-XSS-Protection", "0");

  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  next();
}

export function enforceHttps({ enabled = false } = {}) {
  return function httpsGuard(req, res, next) {
    if (!enabled) {
      return next();
    }

    const proto = req.headers["x-forwarded-proto"];
    const isHttps = req.secure || proto === "https";
    if (isHttps) {
      return next();
    }

    const host = req.headers.host;
    if (!host) {
      return res.status(400).json({ message: "Host header is required." });
    }

    return res.redirect(301, `https://${host}${req.originalUrl}`);
  };
}
