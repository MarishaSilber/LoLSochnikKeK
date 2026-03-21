const API_BASE_URL = 'http://localhost:8000';

// API для пользователей
export const usersApi = {
  async getAllUsers() {
    const response = await fetch(`${API_BASE_URL}/api/v1/users`);
    if (!response.ok) throw new Error('Failed to get users');
    return response.json();
  },

  async getUser(id) {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/${id}`);
    if (!response.ok) throw new Error('Failed to get user');
    return response.json();
  },

  async updateUser(id, userData) {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  }
};

// API для поиска через LLM
export const searchApi = {
  async searchUsers(query) {
    const response = await fetch(`${API_BASE_URL}/api/v1/process-query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: query })
    });
    if (!response.ok) throw new Error('Failed to search');
    const results = await response.json();
    return results.map(r => r.user);
  }
};

// API для онбординга (LLM регистрация)
export const onboardingApi = {
  async startSession() {
    const response = await fetch(`${API_BASE_URL}/api/v1/onboarding/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to start onboarding');
    return response.json();
  },

  async chat(sessionId, message) {
    const response = await fetch(`${API_BASE_URL}/api/v1/onboarding/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, text: message })
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },

  async confirmProfile(sessionId) {
    const response = await fetch(`${API_BASE_URL}/api/v1/onboarding/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });
    if (!response.ok) throw new Error('Failed to confirm profile');
    return response.json();
  }
};

// Health check
export async function healthCheck() {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) throw new Error('Backend is not available');
  return response.json();
}
