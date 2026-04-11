import { clearCurrentUser, getAccessToken } from '../utils/session';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL?.replace(/\/api\/v1$/, '') ||
  'http://localhost:8000';

function buildUrl(path) {
  const normalizedBase = API_BASE_URL === '/' ? '' : API_BASE_URL.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

async function request(path, options = {}) {
  const token = getAccessToken();
  const response = await fetch(buildUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearCurrentUser();
    }
    const rawMessage = await response.text();
    let message = rawMessage;

    try {
      const parsed = JSON.parse(rawMessage);
      if (typeof parsed?.detail === 'string') {
        message = parsed.detail;
      }
    } catch {
      // Keep the original text when the response is not JSON.
    }

    throw new Error(message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const authApi = {
  register(email, password, agreements) {
    return request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        accepted_terms: agreements.acceptedTerms,
        accepted_privacy_policy: agreements.acceptedPrivacyPolicy,
      }),
    });
  },

  login(email, password) {
    return request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  me() {
    return request('/api/v1/auth/me');
  },

  changePassword(currentPassword, newPassword) {
    return request('/api/v1/auth/change-password/request', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  },

  requestPasswordReset(email) {
    return request('/api/v1/auth/password-reset/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  confirmPasswordReset(token, newPassword) {
    return request('/api/v1/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  },

  verifyEmail(token) {
    return request('/api/v1/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  resendVerification(email) {
    return request('/api/v1/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  confirmPasswordChange(token) {
    return request('/api/v1/auth/change-password/confirm', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },
};

export const adminApi = {
  getUsers(filters = {}) {
    const params = new URLSearchParams();

    if (filters.query) {
      params.set('query', filters.query);
    }
    if (filters.course) {
      params.set('course', filters.course);
    }
    if (filters.department) {
      params.set('department', filters.department);
    }
    if (filters.isProfileComplete !== '') {
      params.set('is_profile_complete', String(filters.isProfileComplete));
    }
    if (filters.isAdmin !== '') {
      params.set('is_admin', String(filters.isAdmin));
    }
    if (filters.isHidden !== '') {
      params.set('is_hidden', String(filters.isHidden));
    }

    const suffix = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/v1/admin/users${suffix}`);
  },

  getAuditLogs(filters = {}) {
    const params = new URLSearchParams();

    if (filters.query) {
      params.set('query', filters.query);
    }
    if (filters.action) {
      params.set('action', filters.action);
    }
    if (filters.limit) {
      params.set('limit', filters.limit);
    }

    const suffix = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/v1/admin/audit-logs${suffix}`);
  },

  updateAdminRole(userId, isAdmin) {
    return request(`/api/v1/admin/users/${userId}/admin`, {
      method: 'PATCH',
      body: JSON.stringify({ is_admin: isAdmin }),
    });
  },

  updateVisibility(userId, isHidden) {
    return request(`/api/v1/admin/users/${userId}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ is_hidden: isHidden }),
    });
  },

  deleteUser(userId) {
    return request(`/api/v1/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },

  deleteReview(reviewId) {
    return request(`/api/v1/admin/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  },
};

export const usersApi = {
  getAllUsers() {
    return request('/api/v1/users/');
  },

  getUser(id) {
    return request(`/api/v1/users/${id}`);
  },

  updateUser(id, userData) {
    return request(`/api/v1/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  },

  deleteUser(id) {
    return request(`/api/v1/users/${id}`, {
      method: 'DELETE',
    });
  },
};

export const reviewsApi = {
  getUserReviews(userId) {
    return request(`/api/v1/users/${userId}/reviews`);
  },

  createReview(review) {
    return request('/api/v1/reviews/', {
      method: 'POST',
      body: JSON.stringify(review),
    });
  },
};

export const searchApi = {
  searchUsers(query) {
    return request('/api/v1/search/', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  },
};

export const onboardingApi = {
  startSession() {
    return request('/api/v1/onboarding/start', {
      method: 'POST',
    });
  },

  chat(sessionId, message) {
    return request('/api/v1/onboarding/chat', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, text: message }),
    });
  },

  confirmProfile(sessionId) {
    return request('/api/v1/onboarding/confirm', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    });
  },
};

export const chatApi = {
  listConversations(archived = false) {
    return request(`/api/v1/chat/conversations?archived=${archived}`);
  },

  getConversation(conversationId) {
    return request(`/api/v1/chat/conversations/${conversationId}`);
  },

  getOrCreateDirectConversation(targetUserId) {
    return request(`/api/v1/chat/direct/${targetUserId}`, {
      method: 'POST',
    });
  },

  getSupportConversation() {
    return request('/api/v1/chat/support');
  },

  sendMessage(conversationId, body) {
    return request(`/api/v1/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  },

  setArchived(conversationId, archived) {
    return request(`/api/v1/chat/conversations/${conversationId}/archive`, {
      method: 'POST',
      body: JSON.stringify({ archived }),
    });
  },
};

export function healthCheck() {
  return request('/health');
}
