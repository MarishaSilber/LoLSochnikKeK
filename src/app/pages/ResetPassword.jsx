import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/api';
import './Register.css';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token'), [searchParams]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('В ссылке нет токена для сброса пароля.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают.');
      return;
    }

    setStatus('loading');
    try {
      await authApi.confirmPasswordReset(token, password);
      setStatus('success');
      setMessage('Пароль обновлён. Теперь можно войти в аккаунт.');
    } catch (submitError) {
      setStatus('error');
      setError(submitError.message.replaceAll('"', ''));
    }
  };

  return (
    <div className="register-page">
      <div className="register-auth-shell">
        <div className="register-auth-card">
          <div className="register-auth-kicker">Доступ</div>
          <h1 className="register-auth-title">Сброс пароля</h1>
          <p className="register-auth-subtitle">
            Придумай новый пароль для входа в аккаунт.
          </p>

          <form className="register-auth-form" onSubmit={handleSubmit}>
            <label className="register-auth-label">
              Новый пароль
              <input
                type="password"
                className="register-auth-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Не меньше 6 символов"
                minLength={6}
                required
              />
            </label>

            <label className="register-auth-label">
              Повтори пароль
              <input
                type="password"
                className="register-auth-input"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Повтори пароль"
                minLength={6}
                required
              />
            </label>

            {error && <div className="register-auth-error">{error}</div>}
            {message && <div className="register-auth-subtitle">{message}</div>}

            <button type="submit" className="register-auth-submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Сохраняем...' : 'Обновить пароль'}
            </button>
          </form>

          <div className="register-auth-footer">
            <button type="button" className="register-auth-link" onClick={() => navigate('/login')}>
              Войти
            </button>
            <span className="register-auth-divider">•</span>
            <Link className="register-auth-link" to="/">
              На главную
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
