import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/api';
import './Register.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setStatus('loading');

    try {
      const response = await authApi.requestPasswordReset(email);
      setStatus('success');
      setMessage(
        response?.message ||
          'Если аккаунт существует, мы отправили письмо со ссылкой для сброса пароля.',
      );
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
          <h1 className="register-auth-title">Забыли пароль?</h1>
          <p className="register-auth-subtitle">
            Укажи почту, и мы отправим ссылку для сброса пароля.
          </p>

          <form className="register-auth-form" onSubmit={handleSubmit}>
            <label className="register-auth-label">
              Почта
              <input
                type="email"
                className="register-auth-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                required
              />
            </label>

            {error && <div className="register-auth-error">{error}</div>}
            {message && <div className="register-auth-subtitle">{message}</div>}

            <button type="submit" className="register-auth-submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Отправляем...' : 'Отправить ссылку'}
            </button>
          </form>

          <div className="register-auth-footer">
            <button type="button" className="register-auth-link" onClick={() => navigate('/login')}>
              Вернуться к входу
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
