import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SiteFooter from '../components/SiteFooter';
import { adminApi } from '../api/api';
import { getCurrentUser } from '../utils/session';

const INITIAL_FILTERS = {
  query: '',
  course: '',
  department: '',
  isProfileComplete: '',
  isAdmin: '',
  isHidden: '',
};

const INITIAL_AUDIT_FILTERS = {
  query: '',
  action: '',
  limit: '100',
};

function formatAuditTime(value) {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [auditFilters, setAuditFilters] = useState(INITIAL_AUDIT_FILTERS);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState('');
  const [busyUserId, setBusyUserId] = useState(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user?.id || !user?.isAdmin) {
      navigate('/');
      return;
    }
    if (user.mustChangePassword) {
      navigate(`/edit-profile/${user.id}`);
      return;
    }

    setCurrentUser(user);
  }, [navigate]);

  const loadUsers = async (activeFilters) => {
    if (!currentUser?.id) {
      return;
    }

    setLoadingUsers(true);
    setError('');
    try {
      const data = await adminApi.getUsers(activeFilters);
      setUsers(data);
    } catch (loadError) {
      setError(loadError.message.replaceAll('"', ''));
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadAuditLogs = async (nextFilters = auditFilters) => {
    if (!currentUser?.id) {
      return;
    }

    setLoadingLogs(true);
    setError('');
    try {
      const data = await adminApi.getAuditLogs(nextFilters);
      setAuditLogs(data);
    } catch (loadError) {
      setError(loadError.message.replaceAll('"', ''));
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      loadUsers(filters);
      loadAuditLogs(auditFilters);
    }
  }, [currentUser]);

  const summary = useMemo(
    () => ({
      total: users.length,
      admins: users.filter((user) => user.is_admin).length,
      complete: users.filter((user) => user.is_profile_complete).length,
      hidden: users.filter((user) => user.is_hidden).length,
    }),
    [users]
  );

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleAuditFilterChange = (event) => {
    const { name, value } = event.target;
    setAuditFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    await loadUsers(filters);
  };

  const handleResetFilters = async () => {
    setFilters(INITIAL_FILTERS);
    await loadUsers(INITIAL_FILTERS);
  };

  const handleAuditSearch = async (event) => {
    event.preventDefault();
    await loadAuditLogs(auditFilters);
  };

  const handleAuditReset = async () => {
    setAuditFilters(INITIAL_AUDIT_FILTERS);
    await loadAuditLogs(INITIAL_AUDIT_FILTERS);
  };

  const handleToggleAdmin = async (user) => {
    setBusyUserId(user.id);
    setError('');
    try {
      const updatedUser = await adminApi.updateAdminRole(user.id, !user.is_admin);
      setUsers((prev) => prev.map((item) => (item.id === user.id ? updatedUser : item)));
      await loadAuditLogs(auditFilters);
    } catch (actionError) {
      setError(actionError.message.replaceAll('"', ''));
    } finally {
      setBusyUserId(null);
    }
  };

  const handleToggleVisibility = async (user) => {
    setBusyUserId(user.id);
    setError('');
    try {
      const updatedUser = await adminApi.updateVisibility(user.id, !user.is_hidden);
      setUsers((prev) => prev.map((item) => (item.id === user.id ? updatedUser : item)));
      await loadAuditLogs(auditFilters);
    } catch (actionError) {
      setError(actionError.message.replaceAll('"', ''));
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDeleteUser = async (user) => {
    const confirmed = window.confirm(`Удалить пользователя ${user.full_name}?`);
    if (!confirmed) {
      return;
    }

    setBusyUserId(user.id);
    setError('');
    try {
      await adminApi.deleteUser(user.id);
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      await loadAuditLogs(auditFilters);
    } catch (actionError) {
      setError(actionError.message.replaceAll('"', ''));
    } finally {
      setBusyUserId(null);
    }
  };

  if (!currentUser?.isAdmin) {
    return null;
  }

  return (
    <div className="app">
      <Navbar />
      <div className="page-content admin-page">
        <div className="admin-shell">
          <div className="admin-header">
            <div>
              <div className="admin-kicker">Панель управления</div>
              <h1 className="admin-title">Админка</h1>
              <p className="admin-subtitle">
                Управление пользователями, видимостью профилей и просмотр действий администраторов.
              </p>
            </div>
            <div className="admin-stats">
              <div className="admin-stat-card">
                <span className="admin-stat-value">{summary.total}</span>
                <span className="admin-stat-label">Всего пользователей</span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-value">{summary.complete}</span>
                <span className="admin-stat-label">С заполненным профилем</span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-value">{summary.hidden}</span>
                <span className="admin-stat-label">Скрыто с сайта</span>
              </div>
            </div>
          </div>

          <div className="admin-top-tabs">
            <button
              type="button"
              className={`admin-top-tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Пользователи
            </button>
            <button
              type="button"
              className={`admin-top-tab ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              Аудит-лог
            </button>
          </div>

          {error && <div className="admin-error">{error}</div>}

          {activeTab === 'users' ? (
            <>
              <form className="admin-filters" onSubmit={handleSearch}>
                <input
                  name="query"
                  value={filters.query}
                  onChange={handleFilterChange}
                  className="admin-input"
                  placeholder="Поиск по имени, почте, кафедре, локации"
                />
                <input
                  name="course"
                  value={filters.course}
                  onChange={handleFilterChange}
                  className="admin-input"
                  placeholder="Курс"
                />
                <input
                  name="department"
                  value={filters.department}
                  onChange={handleFilterChange}
                  className="admin-input"
                  placeholder="Кафедра или факультет"
                />
                <select
                  name="isProfileComplete"
                  value={filters.isProfileComplete}
                  onChange={handleFilterChange}
                  className="admin-input"
                >
                  <option value="">Любая заполненность</option>
                  <option value="true">Профиль заполнен</option>
                  <option value="false">Профиль не заполнен</option>
                </select>
                <select
                  name="isAdmin"
                  value={filters.isAdmin}
                  onChange={handleFilterChange}
                  className="admin-input"
                >
                  <option value="">Любые права</option>
                  <option value="true">Только админы</option>
                  <option value="false">Только пользователи</option>
                </select>
                <select
                  name="isHidden"
                  value={filters.isHidden}
                  onChange={handleFilterChange}
                  className="admin-input"
                >
                  <option value="">Любая видимость</option>
                  <option value="false">Только видимые</option>
                  <option value="true">Только скрытые</option>
                </select>
                <div className="admin-filter-actions">
                  <button type="submit" className="admin-btn admin-btn-primary">
                    Найти
                  </button>
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={handleResetFilters}>
                    Сбросить
                  </button>
                </div>
              </form>

              <div className="admin-table-wrap">
                {loadingUsers ? (
                  <div className="admin-empty">Загрузка пользователей...</div>
                ) : users.length === 0 ? (
                  <div className="admin-empty">По текущим фильтрам никто не найден.</div>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Пользователь</th>
                        <th>Учёба</th>
                        <th>Статус</th>
                        <th>Права</th>
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="admin-user-main">{user.full_name}</div>
                            <div className="admin-user-sub">{user.email || 'Без почты'}</div>
                            <div className="admin-user-sub">{user.location_name || 'Локация не указана'}</div>
                          </td>
                          <td>
                            <div className="admin-user-main">{user.department || 'Не указано'}</div>
                            <div className="admin-user-sub">{user.course} курс</div>
                          </td>
                          <td>
                            <span className={`admin-pill ${user.is_profile_complete ? 'ok' : 'muted'}`}>
                              {user.is_profile_complete ? 'Профиль заполнен' : 'Профиль не заполнен'}
                            </span>
                            <div className="admin-pill-stack">
                              <span className={`admin-pill ${user.is_hidden ? 'muted' : 'ok'}`}>
                                {user.is_hidden ? 'Аккаунт скрыт с сайта' : 'Аккаунт виден на сайте'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className={`admin-pill ${user.is_admin ? 'admin' : 'muted'}`}>
                              {user.is_admin ? 'Админ' : 'Пользователь'}
                            </span>
                          </td>
                          <td>
                            <div className="admin-row-actions">
                              <button
                                type="button"
                                className="admin-btn admin-btn-secondary"
                                onClick={() => handleToggleAdmin(user)}
                                disabled={busyUserId === user.id}
                              >
                                {user.is_admin ? 'Снять админа' : 'Сделать админом'}
                              </button>
                              <button
                                type="button"
                                className="admin-btn admin-btn-secondary"
                                onClick={() => handleToggleVisibility(user)}
                                disabled={busyUserId === user.id}
                              >
                                {user.is_hidden ? 'Показать на сайте' : 'Скрыть с сайта'}
                              </button>
                              <button
                                type="button"
                                className="admin-btn admin-btn-danger"
                                onClick={() => handleDeleteUser(user)}
                                disabled={busyUserId === user.id}
                              >
                                Удалить
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <>
              <form className="admin-audit-filters" onSubmit={handleAuditSearch}>
                <input
                  name="query"
                  value={auditFilters.query}
                  onChange={handleAuditFilterChange}
                  className="admin-input"
                  placeholder="Поиск по действию, деталям, имени или почте"
                />
                <input
                  name="action"
                  value={auditFilters.action}
                  onChange={handleAuditFilterChange}
                  className="admin-input"
                  placeholder="Фильтр по action"
                />
                <select
                  name="limit"
                  value={auditFilters.limit}
                  onChange={handleAuditFilterChange}
                  className="admin-input"
                >
                  <option value="50">Последние 50</option>
                  <option value="100">Последние 100</option>
                  <option value="250">Последние 250</option>
                  <option value="500">Последние 500</option>
                </select>
                <div className="admin-filter-actions">
                  <button type="submit" className="admin-btn admin-btn-primary">
                    Обновить
                  </button>
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={handleAuditReset}>
                    Сбросить
                  </button>
                </div>
              </form>

              <div className="admin-table-wrap">
                {loadingLogs ? (
                  <div className="admin-empty">Загрузка аудит-лога...</div>
                ) : auditLogs.length === 0 ? (
                  <div className="admin-empty">По текущим фильтрам записей нет.</div>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Когда</th>
                        <th>Админ</th>
                        <th>Действие</th>
                        <th>Цель</th>
                        <th>Детали</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            <div className="admin-user-main">{formatAuditTime(log.created_at)}</div>
                            <div className="admin-user-sub">ID #{log.id}</div>
                          </td>
                          <td>
                            <div className="admin-user-main">{log.admin_name}</div>
                            <div className="admin-user-sub">{log.admin_email || 'Без почты'}</div>
                          </td>
                          <td>
                            <span className="admin-pill admin">{log.action}</span>
                          </td>
                          <td>
                            <div className="admin-user-main">{log.target_user_name || 'Системное действие'}</div>
                            <div className="admin-user-sub">{log.target_user_email || 'Без пользователя-цели'}</div>
                          </td>
                          <td>
                            <div className="admin-audit-details">{log.details || 'Без деталей'}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
