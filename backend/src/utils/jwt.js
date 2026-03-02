import jwt from "jsonwebtoken";

export function signAuthToken(payload, secret, expiresIn = "7d") {
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyAuthToken(token, secret) {
  return jwt.verify(token, secret);
}
