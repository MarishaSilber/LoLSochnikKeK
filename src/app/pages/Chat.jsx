import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { chatApi } from '../api/api';
import Navbar from '../components/Navbar';
import { getCurrentUser } from '../utils/session';

const POLL_INTERVAL_MS = 5000;

function formatSidebarTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();

  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    ...(isSameDay ? {} : { day: '2-digit', month: '2-digit' }),
  }).format(date);
}

function formatMessageTime(value) {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function buildSearchParams(nextParams) {
  const params = new URLSearchParams();
  Object.entries(nextParams).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  return params;
}

export default function Chat() {
  const navigate = useNavigate();
  const { userId: routeUserId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [draft, setDraft] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [sending, setSending] = useState(false);
  const [archivedView, setArchivedView] = useState(false);
  const [error, setError] = useState('');
  const resolvedDirectRef = useRef(null);
  const messagesEndRef = useRef(null);
  const suppressAutoSelectRef = useRef(false);

  const selectedConversationId = searchParams.get('conversation');
  const targetUserId = searchParams.get('targetUser') || (!selectedConversationId ? routeUserId || '' : '');
  const isAdmin = Boolean(currentUser?.isAdmin);
  const hasSelectedConversation = Boolean(selectedConversationId || activeConversation);
  const activeConversationTitle = activeConversation?.title || 'Чаты';

  const refreshConversationList = async (archivedOnly = archivedView) => {
    const data = await chatApi.listConversations(archivedOnly);
    setConversations(data);
    return data;
  };

  const openConversation = (conversationId, options = {}) => {
    suppressAutoSelectRef.current = false;
    const nextParams = {
      conversation: conversationId,
      tab: isAdmin && archivedView ? 'archived' : '',
    };
    setSearchParams(buildSearchParams(nextParams), options);
  };

  const clearConversationSelection = (options = {}) => {
    suppressAutoSelectRef.current = true;
    const nextParams = {
      tab: isAdmin && archivedView ? 'archived' : '',
    };
    setSearchParams(buildSearchParams(nextParams), options);
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setCurrentUser(user);
  }, [navigate]);

  useEffect(() => {
    const nextArchivedView = isAdmin && searchParams.get('tab') === 'archived';
    setArchivedView(nextArchivedView);
  }, [isAdmin, searchParams]);

  useEffect(() => {
    if (!isAdmin && searchParams.get('tab') === 'archived') {
      setSearchParams(
        buildSearchParams({
          conversation: selectedConversationId,
        }),
        { replace: true }
      );
    }
  }, [isAdmin, searchParams, selectedConversationId, setSearchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, loadingConversation]);

  useEffect(() => {
    if (!currentUser || !targetUserId) {
      return;
    }

    if (resolvedDirectRef.current === targetUserId) {
      return;
    }

    let cancelled = false;
    resolvedDirectRef.current = targetUserId;
    setArchivedView(false);
    setError('');

    const resolveDirectConversation = async () => {
      try {
        const conversation = await chatApi.getOrCreateDirectConversation(targetUserId);
        if (cancelled) {
          return;
        }

        setActiveConversation(conversation);
        setSearchParams(buildSearchParams({ conversation: conversation.id }), { replace: true });
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message.replaceAll('"', ''));
        }
      }
    };

    resolveDirectConversation();

    return () => {
      cancelled = true;
    };
  }, [currentUser, setSearchParams, targetUserId]);

  useEffect(() => {
    if (!currentUser) {
      return undefined;
    }

    let cancelled = false;

    const loadList = async () => {
      setLoadingList(true);
      try {
        const data = await refreshConversationList(archivedView);
        if (cancelled) {
          return;
        }

        setError('');

        if (!targetUserId) {
          if (selectedConversationId) {
            const exists = data.some((conversation) => conversation.id === selectedConversationId);
            if (!exists) {
              if (data.length > 0) {
                openConversation(data[0].id, { replace: true });
              } else {
                clearConversationSelection({ replace: true });
                setActiveConversation(null);
              }
            }
          } else if (data.length > 0 && !suppressAutoSelectRef.current) {
            openConversation(data[0].id, { replace: true });
          } else {
            setActiveConversation(null);
          }
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message.replaceAll('"', ''));
        }
      } finally {
        if (!cancelled) {
          setLoadingList(false);
        }
      }
    };

    loadList();
    const intervalId = window.setInterval(loadList, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [archivedView, currentUser, selectedConversationId, targetUserId]);

  useEffect(() => {
    if (!currentUser || !selectedConversationId) {
      return undefined;
    }

    let cancelled = false;

    const loadConversation = async () => {
      setLoadingConversation(true);
      try {
        const data = await chatApi.getConversation(selectedConversationId);
        if (!cancelled) {
          setActiveConversation(data);
          setError('');
        }
      } catch (requestError) {
        if (!cancelled) {
          setActiveConversation(null);
          setError(requestError.message.replaceAll('"', ''));
        }
      } finally {
        if (!cancelled) {
          setLoadingConversation(false);
        }
      }
    };

    loadConversation();
    const intervalId = window.setInterval(loadConversation, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [currentUser, selectedConversationId]);

  const activeConversationSummary = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const handleToggleArchiveView = (nextArchivedView) => {
    if (!isAdmin && nextArchivedView) {
      return;
    }

    setArchivedView(nextArchivedView);
    const nextParams = {
      conversation: selectedConversationId,
      tab: nextArchivedView && isAdmin ? 'archived' : '',
    };
    setSearchParams(buildSearchParams(nextParams), { replace: true });
  };

  const handleArchiveToggle = async () => {
    if (!activeConversation || !isAdmin) {
      return;
    }

    try {
      const nextArchived = !activeConversation.archived;
      await chatApi.setArchived(activeConversation.id, nextArchived);

      if (nextArchived) {
        await refreshConversationList(archivedView);
        setActiveConversation((prev) => (prev ? { ...prev, archived: true } : prev));

        if (archivedView) {
          clearConversationSelection({ replace: true });
          setActiveConversation(null);
        }
        return;
      }

      const refreshedConversation = await chatApi.getConversation(activeConversation.id);
      setActiveConversation(refreshedConversation);
      handleToggleArchiveView(false);
      openConversation(activeConversation.id, { replace: true });
      await refreshConversationList(false);
    } catch (requestError) {
      setError(requestError.message.replaceAll('"', ''));
    }
  };

  const handleSend = async () => {
    if (!draft.trim() || !activeConversation || sending) {
      return;
    }

    setSending(true);
    try {
      await chatApi.sendMessage(activeConversation.id, draft.trim());
      setDraft('');
      const [conversationData] = await Promise.all([
        chatApi.getConversation(activeConversation.id),
        refreshConversationList(false),
      ]);
      setActiveConversation(conversationData);
      if (archivedView) {
        handleToggleArchiveView(false);
      }
    } catch (requestError) {
      setError(requestError.message.replaceAll('"', ''));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="app">
      <Navbar />
      <div className={`chat-layout ${hasSelectedConversation ? 'chat-layout-conversation-open' : ''}`}>
        <aside className={`chat-sidebar ${hasSelectedConversation ? 'chat-sidebar-hidden-mobile' : ''}`}>
          <div className="chat-sidebar-top">
            <div>
              <h2 className="chat-sidebar-title">Чаты</h2>
              <div className="chat-sidebar-subtitle">
                {archivedView ? 'Архивные диалоги' : 'Активные диалоги'}
              </div>
            </div>
            {isAdmin && (
              <div className="chat-tabs">
                <button
                  type="button"
                  className={`chat-tab ${!archivedView ? 'active' : ''}`}
                  onClick={() => handleToggleArchiveView(false)}
                >
                  Активные
                </button>
                <button
                  type="button"
                  className={`chat-tab ${archivedView ? 'active' : ''}`}
                  onClick={() => handleToggleArchiveView(true)}
                >
                  Архив
                </button>
              </div>
            )}
          </div>

          <div className="chat-thread-list">
            {loadingList && conversations.length === 0 ? (
              <div className="chat-list-state">Загружаем чаты...</div>
            ) : conversations.length === 0 ? (
              <div className="chat-list-state">
                {archivedView ? 'В архиве пока пусто.' : 'У вас пока нет чатов.'}
              </div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  className={`chat-thread-preview ${selectedConversationId === conversation.id ? 'active' : ''}`}
                  onClick={() => openConversation(conversation.id)}
                >
                  <div className="chat-thread-row">
                    <div className="chat-thread-name">
                      {conversation.title}
                      {conversation.kind === 'support' && <span className="chat-thread-badge">support</span>}
                    </div>
                    <div className="chat-thread-time">{formatSidebarTime(conversation.last_message_at)}</div>
                  </div>
                  <div className="chat-thread-row">
                    <div className="chat-thread-text">{conversation.last_message_text || 'Сообщений пока нет'}</div>
                    {conversation.unread_count > 0 && <span className="chat-thread-unread">{conversation.unread_count}</span>}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className={`chat-main ${hasSelectedConversation ? 'chat-main-visible-mobile' : 'chat-main-hidden-mobile'}`}>
          <div className="chat-header-bar">
            <div>
              <button
                type="button"
                className="chat-mobile-back"
                onClick={() => {
                  setActiveConversation(null);
                  clearConversationSelection();
                }}
              >
                ← К чатам
              </button>
              <div className="chat-header-name">{activeConversationTitle}</div>
              <div className="chat-header-subtitle">
                {activeConversation?.kind === 'support' ? 'Чат с техподдержкой' : 'Личный диалог'}
              </div>
            </div>
            {isAdmin && activeConversation && (
              <button type="button" className="chat-archive-btn" onClick={handleArchiveToggle}>
                {activeConversation.archived ? 'Достать из архива' : 'В архив'}
              </button>
            )}
          </div>

          {error && <div className="chat-error">{error}</div>}

          <div className="chat-messages">
            {loadingConversation && !activeConversation ? (
              <div className="chat-empty-state">Загружаем переписку...</div>
            ) : !activeConversation ? (
              <div className="chat-empty-state">
                {archivedView ? 'Выберите архивный чат слева.' : 'Выберите чат слева или откройте его из карточки пользователя.'}
              </div>
            ) : activeConversation.messages.length === 0 ? (
              <div className="chat-empty-state">История сообщений пока пуста. Можно написать первым.</div>
            ) : (
              activeConversation.messages.map((message) => {
                const isOutgoing = message.sender_id === currentUser.id;

                return (
                  <div key={message.id} className={`chat-message-row ${isOutgoing ? 'outgoing' : 'incoming'}`}>
                    <div className={`chat-bubble ${isOutgoing ? 'chat-bubble-outgoing' : 'chat-bubble-incoming'}`}>
                      <div className="chat-bubble-text">{message.body}</div>
                      <div className={`chat-bubble-meta ${isOutgoing ? 'outgoing' : 'incoming'}`}>
                        <span>{formatMessageTime(message.created_at)}</span>
                        {isOutgoing && <span className="chat-read-status">{message.read_at ? '✓✓' : '✓'}</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-bar">
            <textarea
              rows={2}
              placeholder={activeConversation ? 'Напишите сообщение...' : 'Сначала выберите чат'}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              className="chat-input"
              disabled={!activeConversation || sending}
            />
            <button
              type="button"
              className="chat-send-btn"
              onClick={handleSend}
              disabled={!activeConversation || !draft.trim() || sending}
            >
              {sending ? 'Отправка...' : 'Отправить'}
            </button>
          </div>

          {activeConversationSummary?.archived && isAdmin && (
            <div className="chat-archived-note">
              Этот чат находится в архиве. Новое сообщение автоматически вернёт его в активные.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
