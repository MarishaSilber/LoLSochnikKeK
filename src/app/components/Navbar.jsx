import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/sochnik.png';
import { clearCurrentUser, getCurrentUser } from '../utils/session';

export default function Navbar() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const handleLogout = () => {
    clearCurrentUser();
    setCurrentUser(null);
    setMenuOpen(false);
    navigate('/');
  };

  const handleCloseMenu = () => {
    setMenuOpen(false);
  };

  return (
    <nav>
      <div className="logo" onClick={() => { handleCloseMenu(); navigate('/'); }} style={{ cursor: 'pointer' }}>
        <img src={logo} alt="VuzHub Logo" className="logo-img" />
        <span className="vuz">Vuz</span>
        <span>Hub</span>
      </div>

      <button
        type="button"
        className={`nav-burger ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label="Открыть меню"
        aria-expanded={menuOpen}
      >
        <span />
        <span />
        <span />
      </button>

      <div className={`nav-links ${menuOpen ? 'nav-links-open' : ''}`}>
        {currentUser ? (
          <>
            <Link to="/" className="nav-link" onClick={handleCloseMenu}>
              Главная
            </Link>
            {currentUser.isAdmin && !currentUser.mustChangePassword && (
              <Link to="/admin" className="nav-link" onClick={handleCloseMenu}>
                Админка
              </Link>
            )}
            <Link to="/chat" className="nav-link" onClick={handleCloseMenu}>
              Чаты
            </Link>
            <Link to={`/profile/${currentUser.id}`} className="nav-cta" onClick={handleCloseMenu}>
              Профиль
            </Link>
            <button onClick={handleLogout} className="nav-link logout">
              Выйти
            </button>
          </>
        ) : (
          <>
            <Link to="/" className="nav-link" onClick={handleCloseMenu}>
              Главная
            </Link>
            <Link to="/login" className="nav-link" onClick={handleCloseMenu}>
              Войти
            </Link>
            <Link to="/register" className="nav-cta" onClick={handleCloseMenu}>
              Регистрация
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
