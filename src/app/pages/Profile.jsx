import Navbar from '../components/Navbar';

export default function Profile() {
  const user = {
    name: 'Аня Козлова',
    course: '4 курс',
    faculty: 'Математика',
    bio: 'Прошла через отчисление и восстановление — знаю все подводные камни.',
    tags: ['отчисление', 'академка', 'документы'],
    location: 'Коворкинг Б-214',
    rating: 4.9,
    helped: 23
  };

  return (
    <div className="app">
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
        <div style={{ background: 'white', borderRadius: '10px', padding: '2rem', border: '1px solid #e8e3db' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="avatar av-blush" style={{ width: '60px', height: '60px', fontSize: '20px' }}>АК</div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#4a3d5c' }}>{user.name}</h1>
              <p style={{ fontSize: '14px', color: '#9a939e' }}>{user.course} · {user.faculty}</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#4a3d5c' }}>{user.rating}</div>
              <div style={{ fontSize: '11px', color: '#9a939e', textTransform: 'uppercase' }}>Рейтинг</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#4a3d5c' }}>{user.helped}</div>
              <div style={{ fontSize: '11px', color: '#9a939e', textTransform: 'uppercase' }}>Помог</div>
            </div>
          </div>
          
          <p style={{ fontSize: '14px', color: '#6a6070', lineHeight: '1.6', marginBottom: '1rem' }}>{user.bio}</p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {user.tags.map((tag, i) => (
              <span key={i} className="ctag ctag-b">{tag}</span>
            ))}
          </div>
          
          <p style={{ fontSize: '12px', color: '#9a939e' }}>📍 {user.location}</p>
        </div>
      </div>
    </div>
  );
}
