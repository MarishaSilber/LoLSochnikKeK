import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav>
      <div className="logo">Vuz<span>Hub</span></div>
      <div className="nav-links">
        <Link to="/" className="nav-link">Поиск</Link>
        <button className="nav-link">О проекте</button>
        <Link to="/register" className="nav-cta">Регистрация</Link>
      </div>
    </nav>
  );
}
