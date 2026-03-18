function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }
  return String(value).toLowerCase() === "true";
}

function parseOrigins(raw) {
  if (!raw) {
    return [];
  }
  return String(raw)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getEnvConfig() {
  const {
    NODE_ENV = "development",
    PORT = "5000",
    MONGODB_URI,
    CLIENT_ORIGIN = "http://localhost:8080",
    CLIENT_ORIGINS = "",
    JWT_SECRET,
    TRUST_PROXY = "false",
    ENFORCE_HTTPS = "false",
  } = process.env;

  const errors = [];
  if (!MONGODB_URI) {
    errors.push("Missing MONGODB_URI.");
  }
  if (!JWT_SECRET) {
    errors.push("Missing JWT_SECRET.");
  } else if (JWT_SECRET.length < 32) {
    errors.push("JWT_SECRET must be at least 32 characters for production-safe strength.");
  }

  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }

  const port = Number(PORT);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("PORT must be a positive integer.");
  }

  const defaultDevOrigins = [
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:8082",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ];
  const clientOrigins = Array.from(
    new Set([
      CLIENT_ORIGIN,
      ...parseOrigins(CLIENT_ORIGINS),
      ...(NODE_ENV === "production" ? [] : defaultDevOrigins),
    ])
  );

  return {
    nodeEnv: NODE_ENV,
    isProduction: NODE_ENV === "production",
    port,
    mongoUri: MONGODB_URI,
    jwtSecret: JWT_SECRET,
    clientOrigins,
    trustProxy: parseBoolean(TRUST_PROXY, false),
    enforceHttps: parseBoolean(ENFORCE_HTTPS, NODE_ENV === "production"),
  };
}
