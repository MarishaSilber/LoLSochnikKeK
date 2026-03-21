import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Интерцептор для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export const searchApi = {
  // Поиск студентов по запросу
  searchStudents: async (query) => {
    const response = await api.post('/search', { query })
    return response.data
  },
  
  // Получение профиля студента
  getStudentProfile: async (id) => {
    const response = await api.get(`/students/${id}`)
    return response.data
  },
  
  // Регистрация/обновление профиля
  updateProfile: async (profileData) => {
    const response = await api.put('/profile', profileData)
    return response.data
  },
  
  // Получение текущего профиля пользователя
  getCurrentProfile: async () => {
    const response = await api.get('/profile')
    return response.data
  },
  
  // Отправка сообщения
  sendMessage: async (recipientId, message) => {
    const response = await api.post('/messages', { recipientId, message })
    return response.data
  },
  
  // Получение списка чатов
  getChats: async () => {
    const response = await api.get('/chats')
    return response.data
  },
  
  // Получение сообщений чата
  getChatMessages: async (chatId) => {
    const response = await api.get(`/chats/${chatId}/messages`)
    return response.data
  },
}

export default api
