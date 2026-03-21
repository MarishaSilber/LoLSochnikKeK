import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    course: '',
    faculty: '',
    bio: '',
    tags: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Register:', formData);
    navigate('/');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="app">
      <Navbar />
      <div style={{ maxWidth: '500px', margin: '3rem auto', padding: '2rem' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '1.5rem', color: '#4a3d5c' }}>Регистрация</h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '0.5rem', color: '#9a939e' }}>Имя</label>
            <input 
              name="name"
              value={formData.name}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px', border: '1px solid #e8e3db', borderRadius: '6px', fontFamily: 'TTWellingtons' }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '0.5rem', color: '#9a939e' }}>Email</label>
            <input 
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px', border: '1px solid #e8e3db', borderRadius: '6px', fontFamily: 'TTWellingtons' }}
              required
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
                <option value="">Выберите курс</option>
                <option value="1">1 курс</option>
                <option value="2">2 курс</option>
                <option value="3">3 курс</option>
                <option value="4">4 курс</option>
                <option value="mag">Магистратура</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '0.5rem', color: '#9a939e' }}>Факультет</label>
              <input 
                name="faculty"
                value={formData.faculty}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', border: '1px solid #e8e3db', borderRadius: '6px', fontFamily: 'TTWellingtons' }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '0.5rem', color: '#9a939e' }}>О себе</label>
            <textarea 
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="4"
              style={{ width: '100%', padding: '10px', border: '1px solid #e8e3db', borderRadius: '6px', fontFamily: 'TTWellingtons', resize: 'vertical' }}
              placeholder="Расскажите, чем можете помочь..."
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '0.5rem', color: '#9a939e' }}>Темы (через запятую)</label>
            <input 
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px', border: '1px solid #e8e3db', borderRadius: '6px', fontFamily: 'TTWellingtons' }}
              placeholder="Python, диплом, стресс..."
            />
          </div>
          <button 
            type="submit"
            style={{ 
              marginTop: '1rem',
              padding: '12px', 
              background: '#4a3d5c', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontFamily: 'TTWellingtons',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Зарегистрироваться
          </button>
        </form>
      </div>
    </div>
  );
}
