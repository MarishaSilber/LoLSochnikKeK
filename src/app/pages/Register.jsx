import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingApi } from '../api/api';
import './Register.css';

const STEPS = [
  { title: 'Знакомство', desc: 'Имя и факультет' },
  { title: 'Чем помогаешь', desc: 'Темы, опыт, компетенции' },
  { title: 'Где найти', desc: 'Локация на факультете' },
  { title: 'Контакты', desc: 'Telegram или email' },
  { title: 'Готово', desc: 'Публикация профиля' },
];

export default function Register() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Инициализация сессии
  useEffect(() => {
    const initSession = async () => {
      try {
        const data = await onboardingApi.startSession();
        setSessionId(data.session_id);
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setMessages([{ 
            type: 'bot', 
            text: 'Привет! Я помогу заполнить твой профиль. Это займёт пару минут.\n\nНачнём с главного — как тебя зовут и на каком ты курсе?' 
          }]);
        }, 800);
      } catch (error) {
        console.error('Error starting onboarding:', error);
      }
    };
    initSession();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId) return;

    const newMessages = [...messages, { type: 'user', text: inputValue }];
    setMessages(newMessages);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await onboardingApi.chat(sessionId, inputValue);
      
      // Обновляем извлечённые данные в реальном времени
      if (response.extracted_data) {
        setExtractedData(response.extracted_data);
      }

      setTimeout(() => {
        setIsTyping(false);
        const botMsg = { 
          type: 'bot', 
          text: response.reply,
          showComplete: response.is_ready_to_confirm
        };
        setMessages((prev) => [...prev, botMsg]);
        
        if (response.is_ready_to_confirm) {
          setIsComplete(true);
          setCurrentStep(4); // Последний шаг
        } else {
          // Переходим к следующему шагу только если бот готов
          setCurrentStep(prev => {
            const next = prev + 1;
            return next < STEPS.length ? next : prev;
          });
        }
      }, 800);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      setMessages((prev) => [...prev, { type: 'bot', text: 'Произошла ошибка. Попробуйте ещё раз.' }]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  const getInitials = (name) => {
    if (!name) return 'АК';
    const parts = name.split(' ');
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleGoToProfile = async () => {
    if (!sessionId) {
      alert('Ошибка: нет сессии');
      return;
    }
    try {
      const userData = await onboardingApi.confirmProfile(sessionId);
      window.location.href = `/profile/${userData.id}`;
    } catch (error) {
      console.error('Error confirming profile:', error);
      alert('Ошибка: ' + error.message);
      navigate('/');
    }
  };

  const handleGoToSearch = () => {
    navigate('/');
  };

  return (
    <div className="register-page">
      <nav className="navbar">
        <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div className="logo-box">V</div>
          <div className="logo-text">
            Vuz<span>Hub</span>
          </div>
        </div>
        <div className="nav-right">
          <button className="nav-back" onClick={handleGoToSearch}>
            ← К поиску
          </button>
          <div className="nav-hint">Регистрация через AI-помощника</div>
        </div>
      </nav>

      <div className="layout full-screen">
        <div className="left-panel">
          <div className="left-label">Шаги регистрации</div>

          <div className="step-list">
            {STEPS.map((step, index) => (
              <div className="step" key={index}>
                <div
                  className={`step-num ${
                    index < currentStep ? 'done' : index === currentStep ? 'active' : 'idle'
                  }`}
                >
                  {index < currentStep ? '✓' : index + 1}
                </div>
                <div className="step-content">
                  <div className={`step-title ${index > currentStep ? 'idle' : ''}`}>
                    {step.title}
                  </div>
                  <div className="step-desc">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="preview-card">
            <div className="preview-label">Предпросмотр профиля</div>
            <div className="preview-head">
              <div className="preview-avatar">
                {getInitials(extractedData?.full_name)}
              </div>
              <div>
                <div className="preview-name">
                  {extractedData?.full_name || 'Имя Фамилия'}
                </div>
                <div className="preview-sub">
                  {extractedData?.department || 'Факультет'}
                  {extractedData?.course && ` · ${extractedData.course} курс`}
                </div>
              </div>
            </div>
            <div className="preview-tags">
              {(extractedData?.tags_array || []).slice(0, 3).map((tag, idx) => (
                <span key={idx} className="ptag">
                  {tag}
                </span>
              ))}
              {(extractedData?.tags_array || []).length > 3 && (
                <span className="ptag" style={{ opacity: 0.4 }}>
                  + ещё...
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>

          <div className="chat-header">
            <div className="chat-header-title">{STEPS[currentStep]?.title}</div>
            <div className="chat-header-sub">
              Шаг {currentStep + 1} из {STEPS.length} — AI поможет заполнить профиль
            </div>
          </div>

          <div className="messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`msg ${msg.type}`}>
                <div className={`msg-avatar ${msg.type === 'bot' ? 'bot' : 'me'}`}>
                  {msg.type === 'bot' ? '✦' : getInitials(extractedData?.full_name)}
                </div>
                <div>
                  <div className={`bubble ${msg.type}`}>
                    {msg.text.split('\n').map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < msg.text.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                    {msg.showComplete && (
                      <div className="complete-actions">
                        <button className="btn-primary" onClick={handleGoToProfile}>
                          Открыть профиль
                        </button>
                        <button className="btn-ghost" onClick={handleGoToSearch}>
                          Перейти к поиску
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="msg-time" style={{ textAlign: msg.type === 'user' ? 'right' : '' }}>
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="msg">
                <div className="msg-avatar bot">✦</div>
                <div>
                  <div className="typing">
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
            <div className="input-area">
              <div className="input-wrap">
                <input
                  type="text"
                  placeholder="Напиши что-нибудь..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button className="send-btn" onClick={handleSendMessage}>
                  Отправить
                </button>
              </div>
              <div className="input-hint">AI сам сформирует текст профиля из твоих ответов</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
