import { verifyAuthToken } from "../utils/jwt.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing authentication token." });
  }

  try {
    const decoded = verifyAuthToken(token, process.env.JWT_SECRET);
    req.auth = decoded;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired authentication token." });
  }
}
