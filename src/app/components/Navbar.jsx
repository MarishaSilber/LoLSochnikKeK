import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/sochnik.png';
import { clearCurrentUser, getCurrentUser } from '../utils/session';

export default function Navbar() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const handleLogout = () => {
    clearCurrentUser();
    setCurrentUser(null);
    navigate('/');
  };

  return (
    <nav>
      <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <img src={logo} alt="VuzHub Logo" className="logo-img" />
        <span className="vuz">Vuz</span>
        <span>Hub</span>
      </div>
      <div className="nav-links">
        {currentUser ? (
          <>
            {currentUser.isAdmin && !currentUser.mustChangePassword && (
              <Link to="/admin" className="nav-link">
                Админка
              </Link>
            )}
            <Link to="/chat" className="nav-link">
              Чаты
            </Link>
            <Link to={`/profile/${currentUser.id}`} className="nav-cta">
              Профиль
            </Link>
            <button onClick={handleLogout} className="nav-link logout">
              Выйти
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">
              Войти
            </Link>
            <Link to="/register" className="nav-cta">
              Регистрация
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
