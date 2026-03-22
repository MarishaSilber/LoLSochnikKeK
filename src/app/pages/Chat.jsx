import Navbar from '../components/Navbar';

export default function Chat() {
  return (
    <div className="app">
      <Navbar />
      <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>
        <div style={{ width: '280px', borderRight: '1px solid #e8e3db', background: 'white', padding: '1rem' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '1rem', color: '#4a3d5c' }}>Сообщения</h2>
          <div style={{ padding: '0.75rem', background: '#f5f2ec', borderRadius: '8px', marginBottom: '0.5rem' }}>
            <div style={{ fontWeight: '600', fontSize: '13px', color: '#4a3d5c' }}>Аня Козлова</div>
            <div style={{ fontSize: '12px', color: '#9a939e' }}>Спасибо за помощь!</div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #e8e3db', background: 'white' }}>
            <div style={{ fontWeight: '600', color: '#4a3d5c' }}>Аня Козлова</div>
          </div>
          <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ alignSelf: 'flex-start', background: '#f5f2ec', padding: '0.75rem 1rem', borderRadius: '12px', maxWidth: '70%', fontSize: '14px' }}>
              Привет! Можешь помочь с документами?
            </div>
            <div style={{ alignSelf: 'flex-end', background: '#4a3d5c', color: 'white', padding: '0.75rem 1rem', borderRadius: '12px', maxWidth: '70%', fontSize: '14px' }}>
              Конечно! Что именно нужно?
            </div>
          </div>
          <div style={{ padding: '1rem', borderTop: '1px solid #e8e3db', background: 'white' }}>
            <input 
              type="text" 
              placeholder="Напишите сообщение..."
              style={{ width: '100%', padding: '10px', border: '1px solid #e8e3db', borderRadius: '8px', fontFamily: 'TTWellingtons' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
