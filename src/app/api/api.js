const API_BASE_URL = 'http://localhost:8000/api/v1';

// API для работы с пользователями
export const usersApi = {
  // Получить всех пользователей
  async getUsers(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.skip) queryParams.append('skip', params.skip);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.course) queryParams.append('course', params.course);
    if (params.department) queryParams.append('department', params.department);
    if (params.is_mentor !== undefined) queryParams.append('is_mentor', params.is_mentor);
    
    const response = await fetch(`${API_BASE_URL}/users/?${queryParams}`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  // Получить пользователя по ID
  async getUser(userId) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  // Создать пользователя
  async createUser(userData) {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  },

  // Обновить пользователя
  async updateUser(userId, userData) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },

  // Удалить пользователя
  async deleteUser(userId) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete user');
  },

  // Поиск пользователей
  async searchUsers(query) {
    const response = await fetch(`${API_BASE_URL}/search/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    });
    if (!response.ok) throw new Error('Failed to search users');
    return response.json();
  },

  // Обновить теги пользователя
  async updateUserTags(userId, tags) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags })
    });
    if (!response.ok) throw new Error('Failed to update tags');
    return response.json();
  },

  // Обновить embedding пользователя
  async updateUserEmbedding(userId, embedding) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/embedding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embedding })
    });
    if (!response.ok) throw new Error('Failed to update embedding');
    return response.json();
  },

  // Создать отзыв
  async createReview(reviewData) {
    const response = await fetch(`${API_BASE_URL}/reviews/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData)
    });
    if (!response.ok) throw new Error('Failed to create review');
    return response.json();
  },

  // Получить отзывы пользователя
  async getUserReviews(userId) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/reviews`);
    if (!response.ok) throw new Error('Failed to fetch reviews');
    return response.json();
  }
};

// API для онбординга
export const onboardingApi = {
  // Начать онбординг
  async startOnboarding() {
    const response = await fetch(`${API_BASE_URL}/onboarding/start`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to start onboarding');
    return response.json();
  },

  // Чат с агентом онбординга
  async chat(sessionId, text) {
    const response = await fetch(`${API_BASE_URL}/onboarding/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, text })
    });
    if (!response.ok) throw new Error('Failed to chat');
    return response.json();
  },

  // Подтвердить профиль
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

// API для обработки запросов
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

// Health check
export async function healthCheck() {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) throw new Error('Backend is not available');
  return response.json();
}
