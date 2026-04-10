import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authApi, usersApi } from '../api/api';
import './Profile.css';
import logo from '../../assets/sochnik.png';
import { getCurrentUser } from '../utils/session';
import { formatCourseLabel, getInitials, mapUserToCard } from '../utils/users';

export default function Profile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [verificationSaving, setVerificationSaving] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userData = await usersApi.getUser(id);
        const mappedUser = mapUserToCard(userData);

        setProfile({
          id: mappedUser.id,
          name: mappedUser.name,
          course: formatCourseLabel(mappedUser.course),
          faculty: mappedUser.faculty,
          location: mappedUser.location,
          hours: 'Пн-Пт, 13:00-18:00',
          telegram: mappedUser.telegram || '@не_указан',
          stats: {
            reviews: 0,
            rating: mappedUser.trustScore ? mappedUser.trustScore.toFixed(1) : '5.0',
            helped: mappedUser.helpedCount,
            responseTime: '~1ч',
          },
          bio: mappedUser.bio,
          tags: mappedUser.tags,
        });
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProfile();
    }
  }, [id]);

  const isOwner = currentUser && profile && String(currentUser.id) === String(id);

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Новый пароль и подтверждение не совпадают.');
      return;
    }

    setPasswordSaving(true);
    try {
      await authApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordSuccess('Мы отправили письмо на вашу почту. Новый пароль применится после перехода по ссылке из письма.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (submitError) {
      setPasswordError(submitError.message.replaceAll('"', ''));
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleResendVerification = async () => {
    if (!currentUser?.email || currentUser?.isEmailVerified) {
      return;
    }

    setVerificationSaving(true);
    setVerificationError('');
    setVerificationSuccess('');
    try {
      const response = await authApi.resendVerification(currentUser.email);
      setVerificationSuccess(response.message || 'Мы отправили новое письмо с подтверждением.');
    } catch (submitError) {
      setVerificationError(submitError.message.replaceAll('"', ''));
    } finally {
      setVerificationSaving(false);
    }
  };

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
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <p>Профиль не найден</p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '10px 20px',
              background: '#4a3d5c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  const mainClassName = isOwner ? 'main main-owner' : 'main';

  return (
    <div className="profile-page">
      <nav className="navbar">
        <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="VuzHub Logo" className="logo-img" />
          Vuz<span>Hub</span>
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
            <div className="avatar">{getInitials(profile.name)}</div>
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
            <button className="btn-primary" onClick={() => navigate(`/chat?targetUser=${id}`)}>
              Написать
            </button>
          </div>
        </div>
        <div className="tags-row">
          {(profile.tags || []).map((tag, index) => (
            <span key={index} className="ptag">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className={mainClassName}>
        {isOwner && (
          <div className="column-left">
            <div className="card">
              <div className="card-header">
                <span className="card-title">Безопасность</span>
              </div>
              <div className="card-body">
                {!currentUser?.isEmailVerified && (
                  <div className="profile-password-form" style={{ marginBottom: '1.25rem' }}>
                    <div className="profile-password-copy">
                      Почта ещё не подтверждена. Вы можете пользоваться сайтом, а для смены пароля сначала подтвердите email.
                    </div>
                    {verificationError && <div className="profile-password-error">{verificationError}</div>}
                    {verificationSuccess && <div className="profile-password-success">{verificationSuccess}</div>}
                    <button
                      type="button"
                      disabled={verificationSaving}
                      className="profile-password-submit"
                      onClick={handleResendVerification}
                    >
                      {verificationSaving ? 'Отправляем...' : 'Отправить письмо для подтверждения'}
                    </button>
                  </div>
                )}
                <form onSubmit={handlePasswordSubmit} className="profile-password-form">
                  <div className="profile-password-copy">
                    Здесь можно сменить пароль от аккаунта.
                  </div>
                  <div>
                    <label className="profile-password-label">Текущий пароль</label>
                    <div className="profile-password-field">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        className="profile-password-input"
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        className="profile-password-toggle"
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                      >
                        {showCurrentPassword ? 'Скрыть' : 'Показать'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="profile-password-label">Новый пароль</label>
                    <div className="profile-password-field">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        className="profile-password-input"
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        className="profile-password-toggle"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                      >
                        {showNewPassword ? 'Скрыть' : 'Показать'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="profile-password-label">Подтверждение нового пароля</label>
                    <div className="profile-password-field">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        className="profile-password-input"
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        className="profile-password-toggle"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                      >
                        {showConfirmPassword ? 'Скрыть' : 'Показать'}
                      </button>
                    </div>
                  </div>
                  {passwordError && <div className="profile-password-error">{passwordError}</div>}
                  {passwordSuccess && <div className="profile-password-success">{passwordSuccess}</div>}
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="profile-password-submit"
                  >
                    {passwordSaving ? 'Обновление...' : 'Обновить пароль'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="column-center">
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

        <div className="column-right">
          <div className="card">
            <div className="stat-row">
              <div className="stat-pill">
                <div className="stat-num">{profile.stats.rating}</div>
                <div className="stat-label">совместимость</div>
              </div>
              <div className="stat-pill">
                <div className="stat-num">{profile.stats.helped}</div>
                <div className="stat-label">помог(ла)</div>
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
                  <div className="info-icon blush">📌</div>
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
                  <div className="info-icon olive">✉</div>
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
              <button className="contact-btn" onClick={() => navigate(`/chat?targetUser=${id}`)}>
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
