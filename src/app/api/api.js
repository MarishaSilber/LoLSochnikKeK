const API_BASE_URL = 'http://localhost:8000/api/v1';

// API для пользователей (из Maria_back-end)
export const usersApi = {
  async createUser(userData) {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  },

  async getUser(id) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    if (!response.ok) throw new Error('Failed to get user');
    return response.json();
  },

  async getAllUsers() {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) throw new Error('Failed to get users');
    return response.json();
  }
};

// API для обработки запросов (из Lev_back-end)
export const queryApi = {
  async processQuery(text) {
    const response = await fetch(`${API_BASE_URL}/process-query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!response.ok) throw new Error('Failed to process query');
    return response.json();
  }
};

// API для онбординга (из Lev_back-end)
export const onboardingApi = {
  async startOnboarding() {
    const response = await fetch(`${API_BASE_URL}/onboarding/start`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to start onboarding');
    return response.json();
  },

  async chat(sessionId, text) {
    const response = await fetch(`${API_BASE_URL}/onboarding/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, text })
    });
    if (!response.ok) throw new Error('Failed to chat');
    return response.json();
  },

  async confirmProfile(sessionId) {
    const response = await fetch(`${API_BASE_URL}/onboarding/confirm`, {
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

// Примечание: Lev_back-end не имеет CRUD endpoints для пользователей
// Используйте моковые данные или добавьте endpoints из Maria_back-end
