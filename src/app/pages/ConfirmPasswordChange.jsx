import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/api';
import { getCurrentUser, setCurrentUser } from '../utils/session';
import './Register.css';

export default function ConfirmPasswordChange() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Подтверждаем смену пароля...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('В ссылке нет токена подтверждения.');
      return;
    }

    const confirmChange = async () => {
      try {
        await authApi.confirmPasswordChange(token);
        const currentUser = getCurrentUser();
        if (currentUser) {
          setCurrentUser({ ...currentUser, mustChangePassword: false });
        }
        setStatus('success');
        setMessage('Пароль обновлён. Теперь можно вернуться в профиль или снова войти в аккаунт.');
      } catch (error) {
        setStatus('error');
        setMessage(error.message.replaceAll('"', ''));
      }
    };

    confirmChange();
  }, [searchParams]);

  return (
    <div className="register-page">
      <div className="register-auth-shell">
        <div className="register-auth-card">
          <div className="register-auth-kicker">Смена пароля</div>
          <h1 className="register-auth-title">
            {status === 'success' ? 'Пароль обновлён' : status === 'error' ? 'Не удалось подтвердить действие' : 'Подтверждаем смену пароля'}
          </h1>
          <p className="register-auth-subtitle">{message}</p>
          <button
            type="button"
            className="register-auth-submit"
            onClick={() => navigate(getCurrentUser()?.id ? `/profile/${getCurrentUser().id}` : '/login')}
          >
            {getCurrentUser()?.id ? 'Вернуться в профиль' : 'Перейти ко входу'}
          </button>
        </div>
      </div>
    </div>
  );
}
