import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { usersApi } from '../api/api';

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Пробуем загрузить из localStorage
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.id == id) {
            // Загружаем актуальные данные с бэкенда
            try {
              const data = await usersApi.getUser(id);
              setUser(data);
            } catch (err) {
              // Если бэкенд недоступен, используем localStorage
              setUser(parsed);
            }
            setLoading(false);
            return;
          }
        }

        // Если не в localStorage, загружаем с бэкенда
        if (id) {
          try {
            const data = await usersApi.getUser(id);
            setUser(data);
          } catch (err) {
            if (err.response?.status === 404) {
              setError('Пользователь не найден');
            } else {
              setError('Не удалось загрузить профиль');
            }
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('Не удалось загрузить профиль');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="app">
        <Navbar />
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9a939e' }}>
          Загрузка профиля...
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="app">
        <Navbar />
        <div style={{ textAlign: 'center', padding: '3rem', color: '#ac7674' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '1rem' }}>{error || 'Профиль не найден'}</h2>
          <button
            onClick={() => navigate('/')}
            className="btn-s"
            style={{ marginTop: '1rem' }}
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  const avatarLetters = (user.full_name || user.name || '?').split(' ').map(n => n[0]).join('').toUpperCase();
  const avatarType = user.is_mentor ? 'olive' : (user.trust_score || 0) > 3 ? 'blush' : 'deep';
  
  // Форматируем дату последнего посещения
  const formatLastActive = (dateString) => {
    if (!dateString) return 'Неизвестно';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <div className="app">
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
        <div style={{ background: 'white', borderRadius: '10px', padding: '2rem', border: '1px solid #e8e3db' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className={`avatar av-${avatarType}`} style={{ width: '60px', height: '60px', fontSize: '20px' }}>
              {avatarLetters}
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#4a3d5c' }}>
                {user.full_name || user.name}
              </h1>
              <p style={{ fontSize: '14px', color: '#9a939e' }}>
                {user.course} курс · {user.department || user.faculty || 'Не указано'}
                {user.telegram_username && (
                  <span style={{ marginLeft: '0.5rem' }}>
                    · <a href={`https://t.me/${user.telegram_username.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#4a3d5c' }}>
                      {user.telegram_username}
                    </a>
                  </span>
                )}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#4a3d5c' }}>
                {(user.trust_score || 0).toFixed(1)}
              </div>
              <div style={{ fontSize: '11px', color: '#9a939e', textTransform: 'uppercase' }}>Рейтинг</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#4a3d5c' }}>
                {user.helped_count || user.helped || 0}
              </div>
              <div style={{ fontSize: '11px', color: '#9a939e', textTransform: 'uppercase' }}>Помог</div>
            </div>
            {user.is_mentor && (
              <div>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#aeab82' }}>✓</div>
                <div style={{ fontSize: '11px', color: '#9a939e', textTransform: 'uppercase' }}>Ментор</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: '11px', color: '#9a939e', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Был</div>
              <div style={{ fontSize: '12px', color: '#6a6070' }}>
                {formatLastActive(user.last_active)}
              </div>
            </div>
          </div>

          {(user.bio_raw || user.bio) && (
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#4a3d5c', marginBottom: '0.5rem', textTransform: 'uppercase' }}>О себе</h3>
              <p style={{ fontSize: '14px', color: '#6a6070', lineHeight: '1.6' }}>
                {user.bio_raw || user.bio}
              </p>
            </div>
          )}

          {(user.tags_array || user.tags || []).length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#4a3d5c', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Навыки</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {(user.tags_array || user.tags || []).map((tag, i) => (
                  <span key={i} className="ctag ctag-b">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {user.location_name || user.location ? (
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#4a3d5c', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Где найти</h3>
              <p style={{ fontSize: '12px', color: '#9a939e' }}>
                📍 {user.location_name || user.location}
              </p>
            </div>
          ) : null}

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e8e3db' }}>
            <button 
              onClick={() => navigate(`/edit-profile/${id}`)}
              className="btn-s"
              style={{ marginRight: '0.5rem' }}
            >
              ✏️ Редактировать
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem('currentUser');
                navigate('/');
              }}
              className="btn-s"
              style={{ background: '#ac7674' }}
            >
              Выйти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
