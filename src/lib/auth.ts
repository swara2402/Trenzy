const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  isAdmin?: boolean;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

interface MeResponse {
  user: AuthUser;
}

const AUTH_TOKEN_KEY = "smartcart_auth_token";
const AUTH_USER_KEY = "smartcart_user";

export function getAuthToken(): string | null {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // ignore localStorage errors
  }
}

export function getStoredUser(): AuthUser | null {
  try {
    const userStr = window.localStorage.getItem(AUTH_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser): void {
  try {
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch {
    // ignore localStorage errors
  }
}

export function clearAuth(): void {
  try {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
  } catch {
    // ignore localStorage errors
  }
}

export async function login(
  email: string,
  password: string
): Promise<{ user: AuthUser; token: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Login failed" }));
    throw new Error(error.message || "Login failed");
  }

  const data: AuthResponse = await response.json();
  setAuthToken(data.token);
  setStoredUser(data.user);
  return { user: data.user, token: data.token };
}

export async function signup(
  username: string,
  email: string,
  password: string
): Promise<{ user: AuthUser; token: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Signup failed" }));
    throw new Error(error.message || "Signup failed");
  }

  const data: AuthResponse = await response.json();
  setAuthToken(data.token);
  setStoredUser(data.user);
  return { user: data.user, token: data.token };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = getAuthToken();
  if (!token) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    // Token might be expired, clear auth
    clearAuth();
    return null;
  }

  const data: MeResponse = await response.json();
  setStoredUser(data.user);
  return data.user;
}

export async function logout(): Promise<void> {
  clearAuth();
}

export function isAdminUser(user: AuthUser | null): boolean {
  return user?.isAdmin === true;
}
