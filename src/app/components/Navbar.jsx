import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';

export default function Navbar() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    navigate('/');
  };

  return (
    <nav>
      <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <img src={logo} alt="VuzHub Logo" className="logo-img" />
        Vuz<span>Hub</span>
      </div>
      <div className="nav-links">
        {currentUser ? (
          <>
            <Link to={`/profile/${currentUser.id}`} className="nav-cta">Профиль</Link>
            <button onClick={handleLogout} className="nav-link logout">Выйти</button>
          </>
        ) : (
          <Link to="/register" className="nav-cta">Регистрация</Link>
        )}
      </div>
    </nav>
  );
}
