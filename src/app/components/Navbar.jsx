import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

export default function Navbar() {
  return (
    <nav>
      <div className="logo">
        <img src={logo} alt="VuzHub Logo" className="logo-img" />
        Vuz<span>Hub</span>
      </div>
      <div className="nav-links">
        <Link to="/" className="nav-link">Поиск</Link>
        <button className="nav-link">О проекте</button>
        <Link to="/register" className="nav-cta">Регистрация</Link>
      </div>
    </nav>
  );
}
