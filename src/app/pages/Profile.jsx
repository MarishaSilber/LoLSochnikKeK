import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { adminApi, authApi, reviewsApi, usersApi } from '../api/api';
import './Profile.css';
import logo from '../../assets/sochnik.png';
import { getCurrentUser } from '../utils/session';
import { formatCourseLabel, getInitials, mapUserToCard } from '../utils/users';

function buildProfileView(userData, reviewCount = 0) {
  const mappedUser = mapUserToCard(userData);

  return {
    id: mappedUser.id,
    name: mappedUser.name,
    course: formatCourseLabel(mappedUser.course),
    faculty: mappedUser.faculty,
    location: mappedUser.location,
    hours: 'Пн-Пт, 13:00-18:00',
    telegram: mappedUser.telegram || '@не_указан',
    stats: {
      reviews: reviewCount,
      rating: mappedUser.trustScore ? mappedUser.trustScore.toFixed(1) : '5.0',
      helped: mappedUser.helpedCount,
      responseTime: '~1ч',
    },
    bio: mappedUser.bio,
    tags: mappedUser.tags,
  };
}

function formatReviewDate(value) {
  if (!value) {
    return '';
  }

  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return '';
  }
}

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const shouldSkipNextFetchRef = useRef(Boolean(location.state?.updatedUser));

  const [profile, setProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [verificationSaving, setVerificationSaving] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewPage, setReviewPage] = useState(1);

  const [reviewForm, setReviewForm] = useState({
    score: 5,
    comment: '',
  });
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

  const loadReviews = async () => {
    if (!id) {
      return [];
    }
    const nextReviews = await reviewsApi.getUserReviews(id);
    setReviews(nextReviews);
    return nextReviews;
  };

  const loadProfile = async (reviewCountOverride = null) => {
    if (!id) {
      return;
    }
    const userData = await usersApi.getUser(id);
    const reviewCount = reviewCountOverride ?? reviews.length;
    setProfile(buildProfileView(userData, reviewCount));
  };

  useEffect(() => {
    const updatedUser = location.state?.updatedUser;
    if (updatedUser) {
      setProfile((prev) => buildProfileView(updatedUser, prev?.stats?.reviews ?? reviews.length));
      setLoading(false);
    }
  }, [location.state, reviews.length]);

  useEffect(() => {
    const loadPage = async () => {
      try {
        const [userData, userReviews] = await Promise.all([
          usersApi.getUser(id),
          reviewsApi.getUserReviews(id),
        ]);
        setReviews(userReviews);
        setProfile(buildProfileView(userData, userReviews.length));
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };

    if (!id) {
      return;
    }

    if (shouldSkipNextFetchRef.current) {
      shouldSkipNextFetchRef.current = false;
      loadReviews().catch(() => {});
      return;
    }

    loadPage();
  }, [id]);

  useEffect(() => {
    setReviewPage(1);
  }, [id]);

  const isOwner = currentUser && profile && String(currentUser.id) === String(id);
  const isAdmin = Boolean(currentUser?.isAdmin || currentUser?.is_admin);
  const reviewsPerPage = 10;
  const totalReviewPages = Math.max(1, Math.ceil(reviews.length / reviewsPerPage));
  const paginatedReviews = reviews.slice(
    (reviewPage - 1) * reviewsPerPage,
    reviewPage * reviewsPerPage,
  );

  useEffect(() => {
    if (reviewPage > totalReviewPages) {
      setReviewPage(totalReviewPages);
    }
  }, [reviewPage, totalReviewPages]);

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
      setPasswordSuccess(
        'Мы отправили письмо на вашу почту. Новый пароль применится после перехода по ссылке из письма.',
      );
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

  const handleReviewChange = (event) => {
    const { name, value } = event.target;
    setReviewForm((prev) => ({
      ...prev,
      [name]: name === 'score' ? Number(value) : value,
    }));
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!currentUser?.id || !id) {
      return;
    }

    setReviewSaving(true);
    setReviewError('');
    setReviewSuccess('');
    try {
      await reviewsApi.createReview({
        reviewer_id: currentUser.id,
        reviewed_id: id,
        score: Number(reviewForm.score),
        comment: reviewForm.comment.trim() || null,
      });

      const nextReviews = await loadReviews();
      await loadProfile(nextReviews.length);
      setReviewPage(1);
      setReviewForm({ score: 5, comment: '' });
      setReviewSuccess('Отзыв сохранён.');
    } catch (submitError) {
      setReviewError(submitError.message.replaceAll('"', ''));
    } finally {
      setReviewSaving(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!isAdmin) {
      return;
    }

    const confirmed = window.confirm('Удалить этот отзыв?');
    if (!confirmed) {
      return;
    }

    setReviewError('');
    setReviewSuccess('');
    setDeletingReviewId(reviewId);
    try {
      await adminApi.deleteReview(reviewId);
      const nextReviews = await loadReviews();
      await loadProfile(nextReviews.length);
      setReviewPage((current) =>
        Math.min(current, Math.max(1, Math.ceil(nextReviews.length / reviewsPerPage))),
      );
      setReviewSuccess('Отзыв удалён.');
    } catch (actionError) {
      setReviewError(actionError.message.replaceAll('"', ''));
    } finally {
      setDeletingReviewId(null);
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
                      Почта ещё не подтверждена. Вы можете пользоваться сайтом, а для смены
                      пароля сначала подтвердите email.
                    </div>
                    {verificationError && <div className="profile-password-error">{verificationError}</div>}
                    {verificationSuccess && (
                      <div className="profile-password-success">{verificationSuccess}</div>
                    )}
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
                  <button type="submit" disabled={passwordSaving} className="profile-password-submit">
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

          <div className="card card-reviews">
            <div className="card-header">
              <span className="card-title">Отзывы</span>
            </div>
            <div className="card-body">
              {reviews.length > 0 ? (
                <div className="review-list">
                  {paginatedReviews.map((review) => (
                    <article key={review.id} className="review-item">
                      <div className="review-head">
                        <div>
                          <div className="review-author">
                            {review.reviewer_name || 'Пользователь'}
                          </div>
                          <div className="review-date">{formatReviewDate(review.created_at)}</div>
                        </div>
                        <div className="review-head-actions">
                          <div className="review-score">{Number(review.score).toFixed(1)}</div>
                          {isAdmin && (
                            <button
                              type="button"
                              className="review-delete"
                              disabled={deletingReviewId === review.id}
                              onClick={() => handleDeleteReview(review.id)}
                            >
                              {deletingReviewId === review.id ? 'Удаление...' : 'Удалить'}
                            </button>
                          )}
                        </div>
                      </div>
                      {review.comment && <p className="review-comment">{review.comment}</p>}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="review-empty">Пока нет отзывов</div>
              )}

              {reviews.length > 0 && totalReviewPages > 1 && (
                <div className="review-pagination">
                  <button
                    type="button"
                    className="review-page-button"
                    disabled={reviewPage === 1}
                    onClick={() => setReviewPage((page) => Math.max(1, page - 1))}
                  >
                    Назад
                  </button>
                  <div className="review-page-indicator">
                    {reviewPage} / {totalReviewPages}
                  </div>
                  <button
                    type="button"
                    className="review-page-button"
                    disabled={reviewPage === totalReviewPages}
                    onClick={() => setReviewPage((page) => Math.min(totalReviewPages, page + 1))}
                  >
                    Вперёд
                  </button>
                </div>
              )}

              {!isOwner && currentUser && (
                <form className="review-form review-form-compact" onSubmit={handleReviewSubmit}>
                  <div className="review-form-row">
                    <label className="profile-password-label" htmlFor="review-score">
                      Оценка
                    </label>
                    <select
                      id="review-score"
                      name="score"
                      value={reviewForm.score}
                      onChange={handleReviewChange}
                      className="review-select"
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {value} / 5
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="review-form-row">
                    <label className="profile-password-label" htmlFor="review-comment">
                      Комментарий
                    </label>
                    <textarea
                      id="review-comment"
                      name="comment"
                      value={reviewForm.comment}
                      onChange={handleReviewChange}
                      className="review-textarea"
                      placeholder="Напиши короткий отзыв о человеке"
                      rows={4}
                    />
                  </div>
                  {reviewError && <div className="profile-password-error">{reviewError}</div>}
                  {reviewSuccess && <div className="profile-password-success">{reviewSuccess}</div>}
                  <button type="submit" disabled={reviewSaving} className="profile-password-submit">
                    {reviewSaving ? 'Сохраняем...' : 'Оставить отзыв'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="column-right">
          <div className="card">
            <div className="stat-row">
              <div className="stat-pill">
                <div className="stat-num">{profile.stats.rating}</div>
                <div className="stat-label">рейтинг</div>
              </div>
              <div className="stat-pill">
                <div className="stat-num">{profile.stats.reviews}</div>
                <div className="stat-label">отзывы</div>
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
