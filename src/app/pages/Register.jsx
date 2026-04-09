import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, onboardingApi } from '../api/api';
import './Register.css';
import logo from '../../assets/sochnik.png';
import { getCurrentUser, setAccessToken, setCurrentUser } from '../utils/session';
import SiteFooter from '../components/SiteFooter';

const STEPS = [
  { title: 'Знакомство', desc: 'Имя и курс' },
  { title: 'Направление', desc: 'Кафедра или факультет' },
  { title: 'Чем помогаешь', desc: 'Темы, опыт, компетенции' },
  { title: 'Где найти', desc: 'Локация на кампусе' },
  { title: 'Готово', desc: 'Публикация профиля' },
];

function AuthForm({ mode, onSwitchMode, onSubmit, isSubmitting, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacyPolicy, setAcceptedPrivacyPolicy] = useState(false);

  const isRegisterMode = mode === 'register';
  const submitLabel = isRegisterMode ? 'Создать аккаунт' : 'Войти';
  const title = isRegisterMode ? 'Создание аккаунта' : 'Вход в аккаунт';
  const subtitle = isRegisterMode
    ? 'Сначала создаём аккаунт, потом AI помогает собрать профиль.'
    : 'Войди в существующий аккаунт и продолжи регистрацию или открой профиль.';

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isRegisterMode && password !== confirmPassword) {
      return onSubmit({ localError: 'Пароли не совпадают.' });
    }

    if (isRegisterMode && (!acceptedTerms || !acceptedPrivacyPolicy)) {
      return onSubmit({
        localError: 'Нужно принять пользовательское соглашение и политику конфиденциальности.',
      });
    }

    await onSubmit({
      email,
      password,
      confirmPassword,
      acceptedTerms,
      acceptedPrivacyPolicy,
    });
  };

  return (
    <div className="register-auth-shell">
      <div className="register-auth-card">
        <div className="register-auth-kicker">Аккаунт</div>
        <h1 className="register-auth-title">{title}</h1>
        <p className="register-auth-subtitle">{subtitle}</p>

        <div className="register-auth-tabs">
          <button
            type="button"
            className={`register-auth-tab ${isRegisterMode ? 'active' : ''}`}
            onClick={() => onSwitchMode('register')}
          >
            Регистрация
          </button>
          <button
            type="button"
            className={`register-auth-tab ${!isRegisterMode ? 'active' : ''}`}
            onClick={() => onSwitchMode('login')}
          >
            Вход
          </button>
        </div>

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

          <label className="register-auth-label">
            Пароль
            <div className="register-password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                className="register-auth-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Не меньше 6 символов"
                minLength={6}
                required
              />
              <button
                type="button"
                className="register-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? 'Скрыть' : 'Показать'}
              </button>
            </div>
          </label>

          {isRegisterMode && (
            <>
              <label className="register-auth-label">
                Подтверждение пароля
                <div className="register-password-field">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="register-auth-input"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Повтори пароль"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="register-password-toggle"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? 'Скрыть' : 'Показать'}
                  </button>
                </div>
              </label>

              <div className="register-agreements">
                <label className="register-agreement-item">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                  />
                  <span>
                    Я принимаю{' '}
                    <Link to="/terms" target="_blank" rel="noreferrer">
                      пользовательское соглашение
                    </Link>
                  </span>
                </label>

                <label className="register-agreement-item">
                  <input
                    type="checkbox"
                    checked={acceptedPrivacyPolicy}
                    onChange={(event) => setAcceptedPrivacyPolicy(event.target.checked)}
                  />
                  <span>
                    Я принимаю{' '}
                    <Link to="/privacy-policy" target="_blank" rel="noreferrer">
                      политику конфиденциальности
                    </Link>
                  </span>
                </label>
              </div>
            </>
          )}

          {error && <div className="register-auth-error">{error}</div>}

          <button type="submit" className="register-auth-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Подождите...' : submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Register({ initialAuthMode = 'register' }) {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState(initialAuthMode);
  const [authUser, setAuthUser] = useState(() => getCurrentUser());
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const canStartOnboarding = Boolean(authUser?.id && !authUser?.isAdmin && !sessionId && !isComplete);

  useEffect(() => {
    const initSession = async () => {
      if (!canStartOnboarding) {
        return;
      }

      try {
        const data = await onboardingApi.startSession();
        setSessionId(data.session_id);
        setMessages([
          {
            type: 'bot',
            text: 'Привет! Я помогу заполнить твой профиль. Это займёт пару минут.\n\nНачнём с главного: как тебя зовут и на каком ты курсе?',
          },
        ]);
        setError('');
      } catch {
        setError('Не удалось начать AI-регистрацию. Проверь backend и попробуй ещё раз.');
      }
    };

    initSession();
  }, [authUser, canStartOnboarding, sessionId, isComplete]);

  const applyChatResponse = (response) => {
    const replyText =
      typeof response?.reply === 'string'
        ? response.reply
        : response?.reply == null
          ? 'Не удалось обработать ответ.'
          : String(response.reply);
    const nextExtractedData =
      response?.extracted_data && typeof response.extracted_data === 'object' ? response.extracted_data : null;

    if (nextExtractedData) {
      setExtractedData(nextExtractedData);
    }

    setMessages((prev) => [
      ...prev,
      {
        type: 'bot',
        text: replyText,
        showComplete: Boolean(response?.is_ready_to_confirm),
      },
    ]);

    if (response?.is_ready_to_confirm) {
      setIsComplete(true);
      setCurrentStep(4);
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const sendToOnboarding = async (text, shownText = text) => {
    if (!sessionId) {
      return;
    }

    setMessages((prev) => [...prev, { type: 'user', text: shownText }]);
    setInputValue('');
    setIsTyping(true);
    setError('');

    try {
      const response = await onboardingApi.chat(sessionId, text);
      applyChatResponse(response);
    } catch {
      setMessages((prev) => [
        ...prev,
        { type: 'bot', text: 'Произошла ошибка. Попробуй ещё раз.' },
      ]);
      setError('AI-регистрация сейчас недоступна.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleAuthSubmit = async ({
    email,
    password,
    acceptedTerms,
    acceptedPrivacyPolicy,
    localError,
  }) => {
    if (localError) {
      setAuthError(localError);
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const response =
        authMode === 'register'
          ? await authApi.register(email, password, {
              acceptedTerms,
              acceptedPrivacyPolicy,
            })
          : await authApi.login(email, password);

      const user = {
        id: response.id,
        email: response.email,
        name: response.full_name,
        isProfileComplete: response.is_profile_complete,
        isAdmin: response.is_admin,
        mustChangePassword: response.must_change_password,
      };

      setAccessToken(response.access_token);
      setCurrentUser(user);
      setAuthUser(user);

      if (response.is_admin) {
        navigate('/admin');
      } else if (response.must_change_password) {
        navigate(`/edit-profile/${response.id}`);
      } else if (authMode === 'login' && response.is_profile_complete) {
        navigate(`/profile/${response.id}`);
      }
    } catch (submitError) {
      setAuthError(submitError.message.replaceAll('"', ''));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) {
      return;
    }

    if (!sessionId) {
      setError('Сессия AI-регистрации ещё не готова. Подожди пару секунд и попробуй снова.');
      return;
    }

    await sendToOnboarding(inputValue.trim());
  };

  const handleSkipQuestion = async () => {
    if (!sessionId || isComplete || isTyping) {
      return;
    }

    if (currentStep === 0) {
      setError('Имя, фамилию и курс пропустить нельзя.');
      return;
    }

    await sendToOnboarding('__skip__', 'Пропустить');
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };

  const getInitials = (name) => {
    if (!name) {
      return 'АК';
    }
    const parts = name.split(' ');
    return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase();
  };

  const progress = useMemo(() => ((currentStep + 1) / STEPS.length) * 100, [currentStep]);

  const handleGoToProfile = async () => {
    if (!sessionId) {
      setError('Нет активной сессии регистрации.');
      return;
    }

    try {
      const userData = await onboardingApi.confirmProfile(sessionId);
      const nextUser = {
        id: userData.id,
        email: authUser?.email,
        name: userData.full_name,
        isProfileComplete: true,
        isAdmin: authUser?.isAdmin || false,
        mustChangePassword: false,
      };
      setCurrentUser(nextUser);
      window.location.href = `/profile/${userData.id}`;
    } catch {
      setError('Не удалось сохранить профиль.');
    }
  };

  if (!authUser) {
    return (
      <div className="register-page">
        <nav className="register-navbar">
          <div className="register-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <img src={logo} alt="VuzHub Logo" className="logo-img" />
            Vuz<span>Hub</span>
          </div>
          <div className="register-nav-right">
            <button className="nav-back" onClick={() => navigate('/')}>
              ← К поиску
            </button>
          </div>
        </nav>
        <AuthForm
          mode={authMode}
          onSwitchMode={setAuthMode}
          onSubmit={handleAuthSubmit}
          isSubmitting={authLoading}
          error={authError}
        />
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="register-page">
      <nav className="register-navbar">
        <div className="register-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="VuzHub Logo" className="logo-img" />
          Vuz<span>Hub</span>
        </div>
        <div className="register-nav-right">
          <button className="nav-back" onClick={() => navigate('/')}>
            ← К поиску
          </button>
          <div className="register-nav-hint">{authUser.email}</div>
        </div>
      </nav>

      <div className="register-layout">
        <div className="register-left-panel">
          <div className="register-left-label">Шаги регистрации</div>

          <div className="register-step-list">
            {STEPS.map((step, index) => (
              <div className="register-step" key={step.title}>
                <div
                  className={`register-step-num ${
                    index < currentStep ? 'done' : index === currentStep ? 'active' : 'idle'
                  }`}
                >
                  {index < currentStep ? '✓' : index + 1}
                </div>
                <div className="register-step-content">
                  <div className={`register-step-title ${index > currentStep ? 'idle' : ''}`}>
                    {step.title}
                  </div>
                  <div className="register-step-desc">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="register-preview-card">
            <div className="register-preview-label">Предпросмотр профиля</div>
            <div className="register-preview-head">
              <div className="register-preview-avatar">{getInitials(extractedData?.full_name || authUser?.name)}</div>
              <div>
                <div className="register-preview-name">
                  {extractedData?.full_name || authUser?.name || 'Имя Фамилия'}
                </div>
                <div className="register-preview-sub">
                  {extractedData?.department || 'Факультет'}
                  {extractedData?.course && ` · ${extractedData.course} курс`}
                </div>
              </div>
            </div>
            <div className="register-preview-tags">
              {(extractedData?.tags_array || []).slice(0, 3).map((tag, index) => (
                <span key={index} className="register-ptag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="register-right-panel">
          <div className="register-progress-bar">
            <div className="register-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>

          <div className="register-chat-header">
            <div className="register-chat-header-title">{STEPS[currentStep]?.title}</div>
            <div className="register-chat-header-sub">
              Шаг {currentStep + 1} из {STEPS.length} — AI заполнит профиль для твоего аккаунта
            </div>
          </div>

          <div className="register-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`register-msg ${msg.type}`}>
                <div className={`register-msg-avatar ${msg.type === 'bot' ? 'bot' : 'me'}`}>
                  {msg.type === 'bot' ? '✦' : getInitials(extractedData?.full_name || authUser?.name)}
                </div>
                <div>
                  <div className={`register-bubble ${msg.type}`}>
                    {(typeof msg.text === 'string' ? msg.text : String(msg.text ?? '')).split('\n').map((line, lineIndex, lines) => (
                      <span key={lineIndex}>
                        {line}
                        {lineIndex < lines.length - 1 && <br />}
                      </span>
                    ))}
                    {msg.showComplete && (
                      <div className="register-complete-actions">
                        <button className="btn-primary" onClick={handleGoToProfile}>
                          Открыть профиль
                        </button>
                        <button className="btn-ghost" onClick={() => navigate('/')}>
                          Перейти к поиску
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="register-msg-time" style={{ textAlign: msg.type === 'user' ? 'right' : '' }}>
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="register-msg">
                <div className="register-msg-avatar bot">✦</div>
                <div>
                  <div className="register-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {!isComplete && (
            <div className="register-input-area">
              <div className="register-input-wrap">
                <input
                  type="text"
                  placeholder="Напиши что-нибудь..."
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={!sessionId || isTyping}
                />
                <button className="register-send-btn" onClick={handleSendMessage} disabled={isTyping || !sessionId}>
                  Отправить
                </button>
              </div>
              <div className="register-secondary-actions">
                <button
                  type="button"
                  className="register-skip-btn"
                  onClick={handleSkipQuestion}
                  disabled={isTyping || currentStep === 0}
                  title={currentStep === 0 ? 'Имя, фамилия и курс обязательны' : ''}
                >
                  Пропустить вопрос
                </button>
              </div>
              <div className="register-input-hint">
                Данные из этого диалога будут сохранены в твой текущий аккаунт
              </div>
              {error && <div className="register-error">{error}</div>}
            </div>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
