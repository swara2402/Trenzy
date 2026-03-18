import { getAuthToken } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  return response.json();
}

export interface GroupMember {
  userId: string;
  username: string;
  joinedAt: string;
}

export async function getGroups() {
  return fetchWithAuth("/api/groups");
}

export async function createGroup(name: string, description?: string) {
  return fetchWithAuth("/api/groups", {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });
}

export async function getGroup(groupId: string) {
  return fetchWithAuth(`/api/groups/${groupId}`);
}

export async function updateGroupMembers(groupId: string, userId: string, action: 'add' | 'remove') {
  return fetchWithAuth(`/api/groups/${groupId}/members`, {
    method: "PUT",
    body: JSON.stringify({ userId, action }),
  });
}

export async function getGroupRecommendations(groupId: string, limit = 8) {
  return fetchWithAuth(`/api/groups/${groupId}/recommendations?limit=${limit}`);
}

export async function deleteGroup(groupId: string) {
  return fetchWithAuth(`/api/groups/${groupId}`, {
    method: "DELETE",
  });
}

