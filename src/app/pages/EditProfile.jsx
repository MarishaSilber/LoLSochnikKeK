import Navbar from '../components/Navbar';

export default function EditProfile() {
  return (
    <div className="app">
      <Navbar />
      <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '2rem' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '1.5rem', color: '#4a3d5c' }}>Редактировать профиль</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '0.5rem', color: '#9a939e' }}>Имя</label>
            <input defaultValue="Аня Козлова" style={{ width: '100%', padding: '10px', border: '1px solid #e8e3db', borderRadius: '6px', fontFamily: 'TTWellingtons' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '0.5rem', color: '#9a939e' }}>О себе</label>
            <textarea defaultValue="Прошла через отчисление и восстановление" rows="4" style={{ width: '100%', padding: '10px', border: '1px solid #e8e3db', borderRadius: '6px', fontFamily: 'TTWellingtons', resize: 'vertical' }} />
          </div>
          <button style={{ padding: '12px', background: '#4a3d5c', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'TTWellingtons', fontWeight: '600', cursor: 'pointer' }}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
