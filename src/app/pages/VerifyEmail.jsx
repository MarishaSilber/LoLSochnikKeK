import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/api';
import { setAccessToken, setCurrentUser } from '../utils/session';
import './Register.css';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Подтверждаем почту...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('В ссылке нет токена подтверждения.');
      return;
    }

    const verify = async () => {
      try {
        const response = await authApi.verifyEmail(token);
        const user = {
          id: response.id,
          email: response.email,
          name: response.full_name,
          isProfileComplete: response.is_profile_complete,
          isAdmin: response.is_admin,
          mustChangePassword: response.must_change_password,
          isEmailVerified: response.is_email_verified,
        };
        setAccessToken(response.access_token);
        setCurrentUser(user);
        setStatus('success');
        setMessage('Почта подтверждена. Сейчас перенаправим вас в аккаунт.');

        window.setTimeout(() => {
          if (response.is_admin) {
            navigate('/admin');
          } else if (response.must_change_password) {
            navigate(`/edit-profile/${response.id}`);
          } else if (response.is_profile_complete) {
            navigate(`/profile/${response.id}`);
          } else {
            navigate('/register');
          }
        }, 1200);
      } catch (error) {
        setStatus('error');
        setMessage(error.message.replaceAll('"', ''));
      }
    };

    verify();
  }, [navigate, searchParams]);

  return (
    <div className="register-page">
      <div className="register-auth-shell">
        <div className="register-auth-card">
          <div className="register-auth-kicker">Подтверждение почты</div>
          <h1 className="register-auth-title">
            {status === 'success' ? 'Готово' : status === 'error' ? 'Не получилось подтвердить почту' : 'Подтверждаем почту'}
          </h1>
          <p className="register-auth-subtitle">{message}</p>
          {status === 'error' && (
            <button type="button" className="register-auth-submit" onClick={() => navigate('/login')}>
              Перейти ко входу
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
