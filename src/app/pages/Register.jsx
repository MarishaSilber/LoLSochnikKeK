import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { usersApi, onboardingApi } from '../api/api';

export default function Register() {
  const navigate = useNavigate();
  const [useOnboarding, setUseOnboarding] = useState(false);
  const [onboardingSession, setOnboardingSession] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    telegram_username: '',
    course: 1,
    department: '',
    is_mentor: false,
    location_name: '',
    bio_raw: '',
    tags_array: []
  });

  // Начать онбординг
  const startOnboarding = async () => {
    try {
      setIsLoading(true);
      const data = await onboardingApi.startOnboarding();
      setOnboardingSession(data.session_id);
      setChatMessages([{ role: 'assistant', content: 'Привет! Я помогу вам зарегистрироваться. Расскажите немного о себе: как вас зовут и с какого вы курса?' }]);
      setUseOnboarding(true);
    } catch (error) {
      console.error('Failed to start onboarding:', error);
      alert('Не удалось начать онбординг. Попробуйте обычную регистрацию.');
    } finally {
      setIsLoading(false);
    }
  };

  // Отправить сообщение в чат онбординга
  const sendChatMessage = async () => {
    if (!chatInput.trim() || !onboardingSession) return;
    
    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setIsLoading(true);

    try {
      const data = await onboardingApi.chat(onboardingSession, userMessage);
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      
      // Если готовы к подтверждению, сохраняем данные
      if (data.is_ready_to_confirm && data.extracted_data) {
        setFormData(prev => ({
          ...prev,
          ...data.extracted_data
        }));
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Произошла ошибка. Попробуйте еще раз.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Подтвердить профиль после онбординга
  const confirmOnboarding = async () => {
    try {
      setIsLoading(true);
      const user = await onboardingApi.confirmProfile(onboardingSession);
      console.log('User created:', user);
      navigate('/');
    } catch (error) {
      console.error('Failed to confirm:', error);
      alert('Не удалось подтвердить профиль.');
    } finally {
      setIsLoading(false);
    }
  };

  // Обычная регистрация
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await usersApi.createUser(formData);
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
      alert('Ошибка при регистрации. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="app">
      <Navbar />
      <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '1.5rem', color: '#4a3d5c' }}>Регистрация</h1>
        
        {!useOnboarding ? (
          <>
            <button 
              onClick={startOnboarding}
              disabled={isLoading}
              style={{ 
                width: '100%',
                padding: '12px', 
                background: '#ac7674', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontFamily: 'TTWellingtons',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                marginBottom: '1.5rem'
              }}
            >
              {isLoading ? 'Загрузка...' : '🤖 Регистрация с AI-ассистентом'}
            </button>
            
            <div style={{ textAlign: 'center', margin: '1rem 0', color: '#9a939e' }}>или</div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '0.5rem', color: '#9a939e' }}>ФИО</label>
                <input 
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e8e3db', borderRadius: '6px', fontFamily: 'TTWellingtons' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '0.5rem', color: '#9a939e' }}>Telegram</label>
                <input 
                  name="telegram_username"
                  value={formData.telegram_username}
                  onChange={handleChange}
                  placeholder="@username"
                  style={{ width: '100%', padding: '10px', border: '1px solid #e8e3db', borderRadius: '6px', fontFamily: 'TTWellingtons' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '0.5rem', color: '#9a939e' }}>Курс</label>
                  <select 
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px', border: '1px solid #e8e3db', borderRadius: '6px', fontFamily: 'TTWellingtons' }}
                  >
                    <option value="1">1 курс</option>
                    <option value="2">2 курс</option>
                    <option value="3">3 курс</option>
                    <option value="4">4 курс</option>
                    <option value="5">5 курс</option>
                    <option value="6">6 курс</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '0.5rem', color: '#9a939e' }}>Кафедра</label>
                  <input 
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px', border: '1px solid #e8e3db', borderRadius: '6px', fontFamily: 'TTWellingtons' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '0.5rem', color: '#9a939e' }}>Местоположение</label>
                <input 
                  name="location_name"
                  value={formData.location_name}
                  onChange={handleChange}
                  placeholder="Напр. ГЗ, Б-214"
                  style={{ width: '100%', padding: '10px', border: '1px solid #e8e3db', borderRadius: '6px', fontFamily: 'TTWellingtons' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '0.5rem', color: '#9a939e' }}>О себе</label>
                <textarea 
                  name="bio_raw"
                  value={formData.bio_raw}
                  onChange={handleChange}
                  rows="4"
                  style={{ width: '100%', padding: '10px', border: '1px solid #e8e3db', borderRadius: '6px', fontFamily: 'TTWellingtons', resize: 'vertical' }}
                  placeholder="Расскажите, чем можете помочь..."
                />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '12px', fontWeight: '600', color: '#9a939e' }}>
                  <input 
                    type="checkbox"
                    name="is_mentor"
                    checked={formData.is_mentor}
                    onChange={handleChange}
                  />
                  Я ментор (хочу помогать другим)
                </label>
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                style={{ 
                  marginTop: '1rem',
                  padding: '12px', 
                  background: '#4a3d5c', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontFamily: 'TTWellingtons',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ background: 'white', border: '1px solid #e8e3db', borderRadius: '10px', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '1rem', color: '#4a3d5c' }}>AI-Онбординг</h2>
            <div style={{ 
              height: '300px', 
              overflowY: 'auto', 
              marginBottom: '1rem',
              padding: '1rem',
              background: '#f5f2ec',
              borderRadius: '8px'
            }}>
              {chatMessages.map((msg, i) => (
                <div 
                  key={i}
                  style={{ 
                    marginBottom: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: msg.role === 'user' ? '#4a3d5c' : 'white',
                    color: msg.role === 'user' ? 'white' : '#2a2028',
                    maxWidth: '80%',
                    marginLeft: msg.role === 'user' ? 'auto' : '0'
                  }}
                >
                  {msg.content}
                </div>
              ))}
              {isLoading && <div style={{ color: '#9a939e', fontSize: '12px' }}>Печатает...</div>}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Введите сообщение..."
                disabled={isLoading}
                style={{ 
                  flex: 1, 
                  padding: '10px', 
                  border: '1px solid #e8e3db', 
                  borderRadius: '6px',
                  fontFamily: 'TTWellingtons'
                }}
              />
              <button 
                onClick={sendChatMessage}
                disabled={isLoading}
                style={{ 
                  padding: '10px 20px',
                  background: '#4a3d5c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontFamily: 'TTWellingtons',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                ➤
              </button>
            </div>
            {chatMessages.some(m => m.content.includes('[READY_TO_CONFIRM]')) && (
              <button 
                onClick={confirmOnboarding}
                disabled={isLoading}
                style={{ 
                  width: '100%',
                  marginTop: '1rem',
                  padding: '12px', 
                  background: '#aeab82', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontFamily: 'TTWellingtons',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? 'Подтверждение...' : '✓ Подтвердить профиль'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
