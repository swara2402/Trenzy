import type { AuthUser } from "./auth";

export function isAdminUser(user: AuthUser | null): boolean {
  if (!user) return false;
  return user.isAdmin === true;
}

export function getAdminEmailsHint(): string {
  // Admin is now determined by the isAdmin flag in the database
  return "Contact administrator for admin access";
}
