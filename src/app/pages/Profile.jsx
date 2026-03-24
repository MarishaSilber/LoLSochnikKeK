import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usersApi } from '../api/api';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      setCurrentUser(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        console.log('Loading profile:', id);
        const userData = await usersApi.getUser(id);
        console.log('User data:', userData);

        setProfile({
          name: userData.full_name,
          course: `${userData.course} курс`,
          faculty: userData.department,
          location: userData.location_name || 'Не указано',
          hours: 'Пн–Пт, 13:00–18:00',
          telegram: userData.telegram_username || '@не_указан',
          stats: {
            reviews: 0,
            rating: userData.trust_score ? userData.trust_score.toFixed(1) : '5.0',
            helped: 0,
            responseTime: '~1ч',
          },
          bio: userData.bio_raw || 'Нет описания',
          tags: userData.tags_array || [],
        });
      } catch (error) {
        console.error('Error loading profile:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProfile();
    }
  }, [id]);

  const isOwner = currentUser && profile && String(currentUser.id) === String(id);

  if (loading) {
    return (
      <div className="profile-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          Загрузка...
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="profile-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
          <p>Профиль не найден</p>
          <button 
            onClick={() => navigate('/')}
            style={{ padding: '10px 20px', background: '#4a3d5c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  const TAGS = profile.tags || [];

  return (
    <div className="profile-page">
      <nav className="navbar">
        <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div className="logo-box">V</div>
          <div className="logo-text">
            Vuz<span>Hub</span>
          </div>
        </div>
        <div className="nav-right">
          <button className="nav-back" onClick={() => navigate('/')}>
            ← К поиску
          </button>
          {isOwner && (
            <button className="nav-edit" onClick={() => navigate(`/edit-profile/${id}`)}>
              Редактировать
            </button>
          )}
        </div>
      </nav>

      <div className="profile-band">
        <div className="profile-top">
          <div className="avatar-wrap">
            <div className="avatar">
              {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
          </div>
          <div className="profile-meta">
            <div className="profile-name">{profile.name}</div>
            <div className="profile-sub">
              <span>{profile.course}</span>
              <div className="dot"></div>
              <span>{profile.faculty}</span>
              <div className="dot"></div>
              <span>{profile.location}</span>
            </div>
          </div>
          <div className="profile-actions">
            <button className="btn-ghost">{profile.telegram}</button>
            <button className="btn-primary" onClick={() => navigate(`/chat/${id}`)}>
              Написать
            </button>
          </div>
        </div>
        <div className="tags-row">
          {TAGS.map((tag, idx) => (
            <span key={idx} className="ptag">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="main">
        <div className="left">
          <div className="card">
            <div className="card-header">
              <span className="card-title">О себе</span>
            </div>
            <div className="card-body">
              <p className="bio-text">{profile.bio}</p>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Отзывы</span>
            </div>
            <div className="card-body">
              <div style={{ padding: '1rem', textAlign: 'center', color: '#9a939e' }}>
                Пока нет отзывов
              </div>
            </div>
          </div>
        </div>

        <div className="right">
          <div className="card">
            <div className="stat-row">
              <div className="stat-pill">
                <div className="stat-num">{profile.stats.rating}</div>
                <div className="stat-label">совместимость</div>
              </div>
              <div className="stat-pill">
                <div className="stat-num">{profile.stats.helped}</div>
                <div className="stat-label">помогла</div>
              </div>
              <div className="stat-pill">
                <div className="stat-num">{profile.stats.responseTime}</div>
                <div className="stat-label">ответ</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body info-section">
              <div className="info-row">
                <div className="info-item">
                  <div className="info-icon blush">📍</div>
                  <div>
                    <div className="info-label">Где найти</div>
                    <div className="info-value">
                      {profile.location}
                      <br />
                      <span className="info-sub">{profile.hours}</span>
                    </div>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon olive">✉️</div>
                  <div>
                    <div className="info-label">Telegram</div>
                    <div className="info-value telegram">{profile.telegram}</div>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon lilac">🎓</div>
                  <div>
                    <div className="info-label">Факультет</div>
                    <div className="info-value">
                      {profile.faculty}
                      <br />
                      <span className="info-sub">{profile.course}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="contact-block">
              <button className="contact-btn" onClick={() => navigate(`/chat/${id}`)}>
                Написать в чат
              </button>
              <button className="contact-btn-sec">Написать в Telegram</button>
              <div className="contact-hint">Обычно отвечает в течение часа</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
