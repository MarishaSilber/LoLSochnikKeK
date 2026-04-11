import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, onboardingApi } from '../api/api';
import './Register.css';
import logo from '../../assets/sochnik.png';
import { getCurrentUser, setAccessToken, setCurrentUser } from '../utils/session';
import SiteFooter from '../components/SiteFooter';

const STEPS = [
  { title: 'Р—РЅР°РєРѕРјСЃС‚РІРѕ', desc: 'РРјСЏ Рё РєСѓСЂСЃ' },
  { title: 'РќР°РїСЂР°РІР»РµРЅРёРµ', desc: 'РљР°С„РµРґСЂР° РёР»Рё С„Р°РєСѓР»СЊС‚РµС‚' },
  { title: 'Р§РµРј РїРѕРјРѕРіР°РµС€СЊ', desc: 'РўРµРјС‹, РѕРїС‹С‚, РєРѕРјРїРµС‚РµРЅС†РёРё' },
  { title: 'Р“РґРµ РЅР°Р№С‚Рё', desc: 'Р›РѕРєР°С†РёСЏ РЅР° РєР°РјРїСѓСЃРµ' },
  { title: 'Р“РѕС‚РѕРІРѕ', desc: 'РџСѓР±Р»РёРєР°С†РёСЏ РїСЂРѕС„РёР»СЏ' },
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
  const submitLabel = isRegisterMode ? 'РЎРѕР·РґР°С‚СЊ Р°РєРєР°СѓРЅС‚' : 'Р’РѕР№С‚Рё';
  const title = isRegisterMode ? 'РЎРѕР·РґР°РЅРёРµ Р°РєРєР°СѓРЅС‚Р°' : 'Р’С…РѕРґ РІ Р°РєРєР°СѓРЅС‚';
  const subtitle = isRegisterMode
    ? 'РЎРЅР°С‡Р°Р»Р° СЃРѕР·РґР°С‘Рј Р°РєРєР°СѓРЅС‚, РїРѕС‚РѕРј AI РїРѕРјРѕРіР°РµС‚ СЃРѕР±СЂР°С‚СЊ РїСЂРѕС„РёР»СЊ.'
    : 'Р’РѕР№РґРё РІ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёР№ Р°РєРєР°СѓРЅС‚ Рё РїСЂРѕРґРѕР»Р¶Рё СЂРµРіРёСЃС‚СЂР°С†РёСЋ РёР»Рё РѕС‚РєСЂРѕР№ РїСЂРѕС„РёР»СЊ.';

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isRegisterMode && password !== confirmPassword) {
      return onSubmit({ localError: 'РџР°СЂРѕР»Рё РЅРµ СЃРѕРІРїР°РґР°СЋС‚.' });
    }

    if (isRegisterMode && (!acceptedTerms || !acceptedPrivacyPolicy)) {
      return onSubmit({
        localError: 'РќСѓР¶РЅРѕ РїСЂРёРЅСЏС‚СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРѕРµ СЃРѕРіР»Р°С€РµРЅРёРµ Рё РїРѕР»РёС‚РёРєСѓ РєРѕРЅС„РёРґРµРЅС†РёР°Р»СЊРЅРѕСЃС‚Рё.',
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
        <div className="register-auth-kicker">РђРєРєР°СѓРЅС‚</div>
        <h1 className="register-auth-title">{title}</h1>
        <p className="register-auth-subtitle">{subtitle}</p>

        <div className="register-auth-tabs">
          <button
            type="button"
            className={`register-auth-tab ${isRegisterMode ? 'active' : ''}`}
            onClick={() => onSwitchMode('register')}
          >
            Р РµРіРёСЃС‚СЂР°С†РёСЏ
          </button>
          <button
            type="button"
            className={`register-auth-tab ${!isRegisterMode ? 'active' : ''}`}
            onClick={() => onSwitchMode('login')}
          >
            Р’С…РѕРґ
          </button>
        </div>

        <form className="register-auth-form" onSubmit={handleSubmit}>
          <label className="register-auth-label">
            РџРѕС‡С‚Р°
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
            РџР°СЂРѕР»СЊ
            <div className="register-password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                className="register-auth-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="РќРµ РјРµРЅСЊС€Рµ 6 СЃРёРјРІРѕР»РѕРІ"
                minLength={6}
                required
              />
              <button
                type="button"
                className="register-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? 'РЎРєСЂС‹С‚СЊ' : 'РџРѕРєР°Р·Р°С‚СЊ'}
              </button>
            </div>
          </label>

          {isRegisterMode && (
            <>
              <label className="register-auth-label">
                РџРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ РїР°СЂРѕР»СЏ
                <div className="register-password-field">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="register-auth-input"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="РџРѕРІС‚РѕСЂРё РїР°СЂРѕР»СЊ"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="register-password-toggle"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? 'РЎРєСЂС‹С‚СЊ' : 'РџРѕРєР°Р·Р°С‚СЊ'}
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
                    РЇ РїСЂРёРЅРёРјР°СЋ{' '}
                    <Link to="/terms" target="_blank" rel="noreferrer">
                      РїРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРѕРµ СЃРѕРіР»Р°С€РµРЅРёРµ
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
                    РЇ РїСЂРёРЅРёРјР°СЋ{' '}
                    <Link to="/privacy-policy" target="_blank" rel="noreferrer">
                      РїРѕР»РёС‚РёРєСѓ РєРѕРЅС„РёРґРµРЅС†РёР°Р»СЊРЅРѕСЃС‚Рё
                    </Link>
                  </span>
                </label>
              </div>
            </>
          )}

          {error && <div className="register-auth-error">{error}</div>}

          <button type="submit" className="register-auth-submit" disabled={isSubmitting}>
            {isSubmitting ? 'РџРѕРґРѕР¶РґРёС‚Рµ...' : submitLabel}
          </button>
          {!isRegisterMode && (
            <div className="register-auth-footer">
              <Link className="register-auth-link" to="/forgot-password">
                Забыли пароль?
              </Link>
            </div>
          )}
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
            text: 'РџСЂРёРІРµС‚! РЇ РїРѕРјРѕРіСѓ Р·Р°РїРѕР»РЅРёС‚СЊ С‚РІРѕР№ РїСЂРѕС„РёР»СЊ. Р­С‚Рѕ Р·Р°Р№РјС‘С‚ РїР°СЂСѓ РјРёРЅСѓС‚.\n\nРќР°С‡РЅС‘Рј СЃ РіР»Р°РІРЅРѕРіРѕ: РєР°Рє С‚РµР±СЏ Р·РѕРІСѓС‚ Рё РЅР° РєР°РєРѕРј С‚С‹ РєСѓСЂСЃРµ?',
          },
        ]);
        setError('');
      } catch {
        setError('РќРµ СѓРґР°Р»РѕСЃСЊ РЅР°С‡Р°С‚СЊ AI-СЂРµРіРёСЃС‚СЂР°С†РёСЋ. РџСЂРѕРІРµСЂСЊ backend Рё РїРѕРїСЂРѕР±СѓР№ РµС‰С‘ СЂР°Р·.');
      }
    };

    initSession();
  }, [authUser, canStartOnboarding, sessionId, isComplete]);

  const applyChatResponse = (response) => {
    const replyText =
      typeof response?.reply === 'string'
        ? response.reply
        : response?.reply == null
          ? 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕР±СЂР°Р±РѕС‚Р°С‚СЊ РѕС‚РІРµС‚.'
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
        { type: 'bot', text: 'РџСЂРѕРёР·РѕС€Р»Р° РѕС€РёР±РєР°. РџРѕРїСЂРѕР±СѓР№ РµС‰С‘ СЂР°Р·.' },
      ]);
      setError('AI-СЂРµРіРёСЃС‚СЂР°С†РёСЏ СЃРµР№С‡Р°СЃ РЅРµРґРѕСЃС‚СѓРїРЅР°.');
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
        isEmailVerified: response.is_email_verified,
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
      setError('РЎРµСЃСЃРёСЏ AI-СЂРµРіРёСЃС‚СЂР°С†РёРё РµС‰С‘ РЅРµ РіРѕС‚РѕРІР°. РџРѕРґРѕР¶РґРё РїР°СЂСѓ СЃРµРєСѓРЅРґ Рё РїРѕРїСЂРѕР±СѓР№ СЃРЅРѕРІР°.');
      return;
    }

    await sendToOnboarding(inputValue.trim());
  };

  const handleSkipQuestion = async () => {
    if (!sessionId || isComplete || isTyping) {
      return;
    }

    if (currentStep === 0) {
      setError('РРјСЏ, С„Р°РјРёР»РёСЋ Рё РєСѓСЂСЃ РїСЂРѕРїСѓСЃС‚РёС‚СЊ РЅРµР»СЊР·СЏ.');
      return;
    }

    await sendToOnboarding('__skip__', 'РџСЂРѕРїСѓСЃС‚РёС‚СЊ');
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };

  const getInitials = (name) => {
    if (!name) {
      return 'РђРљ';
    }
    const parts = name.split(' ');
    return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase();
  };

  const progress = useMemo(() => ((currentStep + 1) / STEPS.length) * 100, [currentStep]);

  const handleGoToProfile = async () => {
    if (!sessionId) {
      setError('РќРµС‚ Р°РєС‚РёРІРЅРѕР№ СЃРµСЃСЃРёРё СЂРµРіРёСЃС‚СЂР°С†РёРё.');
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
        isEmailVerified: authUser?.isEmailVerified ?? true,
      };
      setCurrentUser(nextUser);
      window.location.href = `/profile/${userData.id}`;
    } catch {
      setError('РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РїСЂРѕС„РёР»СЊ.');
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
              в†ђ Рљ РїРѕРёСЃРєСѓ
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
            в†ђ Рљ РїРѕРёСЃРєСѓ
          </button>
          <div className="register-nav-hint">{authUser.email}</div>
        </div>
      </nav>

      <div className="register-layout">
        <div className="register-left-panel">
          <div className="register-left-label">РЁР°РіРё СЂРµРіРёСЃС‚СЂР°С†РёРё</div>

          <div className="register-step-list">
            {STEPS.map((step, index) => (
              <div className="register-step" key={step.title}>
                <div
                  className={`register-step-num ${
                    index < currentStep ? 'done' : index === currentStep ? 'active' : 'idle'
                  }`}
                >
                  {index < currentStep ? 'вњ“' : index + 1}
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
            <div className="register-preview-label">РџСЂРµРґРїСЂРѕСЃРјРѕС‚СЂ РїСЂРѕС„РёР»СЏ</div>
            <div className="register-preview-head">
              <div className="register-preview-avatar">{getInitials(extractedData?.full_name || authUser?.name)}</div>
              <div>
                <div className="register-preview-name">
                  {extractedData?.full_name || authUser?.name || 'РРјСЏ Р¤Р°РјРёР»РёСЏ'}
                </div>
                <div className="register-preview-sub">
                  {extractedData?.department || 'Р¤Р°РєСѓР»СЊС‚РµС‚'}
                  {extractedData?.course && ` В· ${extractedData.course} РєСѓСЂСЃ`}
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
              РЁР°Рі {currentStep + 1} РёР· {STEPS.length} вЂ” AI Р·Р°РїРѕР»РЅРёС‚ РїСЂРѕС„РёР»СЊ РґР»СЏ С‚РІРѕРµРіРѕ Р°РєРєР°СѓРЅС‚Р°
            </div>
          </div>

          <div className="register-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`register-msg ${msg.type}`}>
                <div className={`register-msg-avatar ${msg.type === 'bot' ? 'bot' : 'me'}`}>
                  {msg.type === 'bot' ? 'вњ¦' : getInitials(extractedData?.full_name || authUser?.name)}
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
                          РћС‚РєСЂС‹С‚СЊ РїСЂРѕС„РёР»СЊ
                        </button>
                        <button className="register-search-cta" onClick={() => navigate('/')}>
                          РџРµСЂРµР№С‚Рё Рє РїРѕРёСЃРєСѓ
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
                <div className="register-msg-avatar bot">вњ¦</div>
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
                  placeholder="РќР°РїРёС€Рё С‡С‚Рѕ-РЅРёР±СѓРґСЊ..."
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={!sessionId || isTyping}
                />
                <button className="register-send-btn" onClick={handleSendMessage} disabled={isTyping || !sessionId}>
                  РћС‚РїСЂР°РІРёС‚СЊ
                </button>
              </div>
              <div className="register-secondary-actions">
                <button
                  type="button"
                  className="register-skip-btn"
                  onClick={handleSkipQuestion}
                  disabled={isTyping || currentStep === 0}
                  title={currentStep === 0 ? 'РРјСЏ, С„Р°РјРёР»РёСЏ Рё РєСѓСЂСЃ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹' : ''}
                >
                  РџСЂРѕРїСѓСЃС‚РёС‚СЊ РІРѕРїСЂРѕСЃ
                </button>
              </div>
              <div className="register-input-hint">
                Р”Р°РЅРЅС‹Рµ РёР· СЌС‚РѕРіРѕ РґРёР°Р»РѕРіР° Р±СѓРґСѓС‚ СЃРѕС…СЂР°РЅРµРЅС‹ РІ С‚РІРѕР№ С‚РµРєСѓС‰РёР№ Р°РєРєР°СѓРЅС‚
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


