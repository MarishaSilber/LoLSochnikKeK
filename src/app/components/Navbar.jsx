import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav>
      <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <img src={logo} alt="VuzHub Logo" className="logo-img" />
        Vuz<span>Hub</span>
      </div>
      <div className="nav-links">
        <Link to="/register" className="nav-cta">Регистрация</Link>
      </div>
    </nav>
  );
}
