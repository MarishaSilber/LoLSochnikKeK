import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function NotFound() {
  return (
    <div className="app">
      <Navbar />
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h1 style={{ fontSize: '72px', fontWeight: '600', color: '#4a3d5c', marginBottom: '1rem' }}>404</h1>
        <p style={{ fontSize: '18px', color: '#9a939e', marginBottom: '2rem' }}>Страница не найдена</p>
        <Link to="/" style={{ display: 'inline-block', padding: '12px 24px', background: '#4a3d5c', color: 'white', textDecoration: 'none', borderRadius: '8px', fontFamily: 'TTWellingtons', fontWeight: '600' }}>
          На главную
        </Link>
      </div>
    </div>
  );
}
