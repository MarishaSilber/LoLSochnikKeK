import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { authApi, usersApi } from '../api/api';
import { getCurrentUser, setCurrentUser } from '../utils/session';
import { mapUserToCard } from '../utils/users';

export default function EditProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    telegram_username: '',
    course: 1,
    department: '',
    location_name: '',
    bio_raw: '',
    tags_array: [],
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
    const currentUser = getCurrentUser();
    if (!currentUser || String(currentUser.id) !== String(id)) {
      navigate(`/profile/${id}`);
      return;
    }

    const loadProfile = async () => {
      try {
        const userData = await usersApi.getUser(id);
        const mappedUser = mapUserToCard(userData);
        setFormData({
          full_name: mappedUser.name,
          telegram_username: mappedUser.telegram || '',
          course: mappedUser.course || 1,
          department: mappedUser.faculty,
          location_name: mappedUser.location,
          bio_raw: mappedUser.bio,
          tags_array: mappedUser.tags,
        });
      } catch {
        navigate(`/profile/${id}`);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      await usersApi.updateUser(id, formData);
      navigate(`/profile/${id}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (event) => {
    const tags = event.target.value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    setFormData((prev) => ({ ...prev, tags_array: tags }));
  };

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
      const currentUser = getCurrentUser();
      if (currentUser) {
        setCurrentUser({ ...currentUser, mustChangePassword: false });
      }
      setPasswordSuccess('Пароль обновлён.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setPasswordError(error.message.replaceAll('"', ''));
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          Загрузка...
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar />
      <div className="edit-profile-shell">
        <h1 className="edit-profile-title">Редактировать профиль</h1>
        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div>
            <label className="edit-profile-label">ФИО</label>
            <input
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="edit-profile-input"
              required
            />
          </div>
          <div>
            <label className="edit-profile-label">Telegram</label>
            <input
              name="telegram_username"
              value={formData.telegram_username}
              onChange={handleChange}
              placeholder="@username"
              className="edit-profile-input"
            />
          </div>
          <div>
            <label className="edit-profile-label">Курс</label>
            <input
              type="number"
              name="course"
              value={formData.course}
              onChange={handleChange}
              min="1"
              max="6"
              className="edit-profile-input"
            />
          </div>
          <div>
            <label className="edit-profile-label">Факультет/кафедра</label>
            <input
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="edit-profile-input"
            />
          </div>
          <div>
            <label className="edit-profile-label">Локация (где найти)</label>
            <input
              name="location_name"
              value={formData.location_name}
              onChange={handleChange}
              placeholder="Например: НЛК, Г-корпус, Технопарк"
              className="edit-profile-input"
            />
          </div>
          <div>
            <label className="edit-profile-label">О себе</label>
            <textarea
              name="bio_raw"
              value={formData.bio_raw}
              onChange={handleChange}
              rows="4"
              className="edit-profile-input edit-profile-textarea"
            />
          </div>
          <div>
            <label className="edit-profile-label">Теги (через запятую)</label>
            <input
              value={formData.tags_array.join(', ')}
              onChange={handleTagsChange}
              placeholder="отчисление, матан, Python"
              className="edit-profile-input"
            />
          </div>
          <div className="edit-profile-actions">
            <button
              type="submit"
              disabled={saving}
              className="edit-profile-button edit-profile-button-primary"
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/profile/${id}`)}
              className="edit-profile-button edit-profile-button-secondary"
            >
              Отмена
            </button>
          </div>
        </form>

        <form onSubmit={handlePasswordSubmit} className="edit-profile-password-card">
          <h2 className="edit-profile-password-title">Сменить пароль</h2>
          <div className="edit-profile-form">
            <div>
              <label className="edit-profile-label">Текущий пароль</label>
              <div className="edit-profile-password-field">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className="edit-profile-input"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="edit-profile-password-toggle"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                >
                  {showCurrentPassword ? 'Скрыть' : 'Показать'}
                </button>
              </div>
            </div>
            <div>
              <label className="edit-profile-label">Новый пароль</label>
              <div className="edit-profile-password-field">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="edit-profile-input"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="edit-profile-password-toggle"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                >
                  {showNewPassword ? 'Скрыть' : 'Показать'}
                </button>
              </div>
            </div>
            <div>
              <label className="edit-profile-label">Подтверждение нового пароля</label>
              <div className="edit-profile-password-field">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className="edit-profile-input"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="edit-profile-password-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? 'Скрыть' : 'Показать'}
                </button>
              </div>
            </div>
            {passwordError && <div className="edit-profile-error">{passwordError}</div>}
            {passwordSuccess && <div className="edit-profile-success">{passwordSuccess}</div>}
            <button
              type="submit"
              disabled={passwordSaving}
              className="edit-profile-button edit-profile-button-primary"
            >
              {passwordSaving ? 'Обновление...' : 'Обновить пароль'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
