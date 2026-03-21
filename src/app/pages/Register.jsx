import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { usersApi } from '../api/api';

export default function Register() {
  const navigate = useNavigate();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const user = await usersApi.createUser(formData);
      localStorage.setItem('currentUser', JSON.stringify(user));
      navigate(`/profile/${user.id}`);
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
      <div className="register-container">
        <h1 className="register-title">Регистрация</h1>
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label className="form-label">ФИО</label>
            <input
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Telegram</label>
            <input
              name="telegram_username"
              value={formData.telegram_username}
              onChange={handleChange}
              placeholder="@username"
              className="form-input"
            />
          </div>
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">Курс</label>
              <select
                name="course"
                value={formData.course}
                onChange={handleChange}
                className="form-input"
              >
                <option value="1">1 курс</option>
                <option value="2">2 курс</option>
                <option value="3">3 курс</option>
                <option value="4">4 курс</option>
                <option value="5">5 курс</option>
                <option value="6">6 курс</option>
              </select>
            </div>
            <div className="form-group flex-1">
              <label className="form-label">Кафедра</label>
              <input
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Местоположение</label>
            <input
              name="location_name"
              value={formData.location_name}
              onChange={handleChange}
              placeholder="Напр. ГЗ, Б-214"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">О себе</label>
            <textarea
              name="bio_raw"
              value={formData.bio_raw}
              onChange={handleChange}
              rows="4"
              className="form-textarea"
              placeholder="Расскажите, чем можете помочь..."
            />
          </div>
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
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
            className="btn-primary register-btn"
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
      </div>
    </div>
  );
}
