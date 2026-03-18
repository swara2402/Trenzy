
import type { Vote, Suggestion } from '@/contexts/SuggestionContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const askFriendsForOpinion = async (productId: string, friendIds: string[]) => {
  const token = localStorage.getItem('smartcart_token');
  const response = await fetch(`${API_BASE_URL}/api/suggestions/ask`, {
    method: 'POST',
    body: JSON.stringify({ productId, friendIds }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });
  return response.json();
};

export const getSuggestionFeedback = async (suggestionId: string) => {
  const token = localStorage.getItem('smartcart_token');
  const response = await fetch(`${API_BASE_URL}/api/suggestions/${suggestionId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return (await response.json()) as Suggestion;
};

export const submitVote = async (suggestionId: string, vote: Vote) => {
  const token = localStorage.getItem('smartcart_token');
  const response = await fetch(`${API_BASE_URL}/api/suggestions/${suggestionId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ vote: vote.vote, comment: vote.comment }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });
  return response.json();
};

export const getUserFriends = async () => {
  // TODO: Implement from groups or contacts
  // Placeholder: return sample friends
  return [
    { id: 'user1', username: 'Alice' },
    { id: 'user2', username: 'Bob' },
    { id: 'user3', username: 'Charlie' }
  ];
};
