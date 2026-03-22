import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { usersApi } from '../api/api';

export default function EditProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    telegram_username: '',
    course: 1,
    department: '',
    location_name: '',
    bio_raw: '',
    tags_array: []
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userData = await usersApi.getUser(id);
        setFormData({
          full_name: userData.full_name || '',
          telegram_username: userData.telegram_username || '',
          course: userData.course || 1,
          department: userData.department || '',
          location_name: userData.location_name || '',
          bio_raw: userData.bio_raw || '',
          tags_array: userData.tags_array || []
        });
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await usersApi.updateUser(id, formData);
      navigate(`/profile/${id}`);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
    setFormData(prev => ({ ...prev, tags_array: tags }));
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
      <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '2rem' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '1.5rem', color: '#4a3d5c' }}>Редактировать профиль</h1>
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
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '0.5rem', color: '#9a939e' }}>Курс</label>
            <input
              type="number"
              name="course"
              value={formData.course}
              onChange={handleChange}
              min="1"
              max="6"
              style={{ width: '100%', padding: '10px', border: '1px solid #e8e3db', borderRadius: '6px', fontFamily: 'TTWellingtons' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '0.5rem', color: '#9a939e' }}>Факультет/Кафедра</label>
            <input
              name="department"
              value={formData.department}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px', border: '1px solid #e8e3db', borderRadius: '6px', fontFamily: 'TTWellingtons' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '0.5rem', color: '#9a939e' }}>Локация (где найти)</label>
            <input
              name="location_name"
              value={formData.location_name}
              onChange={handleChange}
              placeholder="Например: ГЗ, 5-18"
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
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '0.5rem', color: '#9a939e' }}>Теги (через запятую)</label>
            <input
              value={formData.tags_array.join(', ')}
              onChange={handleTagsChange}
              placeholder="отчисление, матан, Python"
              style={{ width: '100%', padding: '10px', border: '1px solid #e8e3db', borderRadius: '6px', fontFamily: 'TTWellingtons' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="submit"
              disabled={saving}
              style={{ flex: 1, padding: '12px', background: '#4a3d5c', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'TTWellingtons', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/profile/${id}`)}
              style={{ flex: 1, padding: '12px', background: 'transparent', color: '#4a3d5c', border: '1px solid #4a3d5c', borderRadius: '8px', fontFamily: 'TTWellingtons', fontWeight: '600', cursor: 'pointer' }}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
