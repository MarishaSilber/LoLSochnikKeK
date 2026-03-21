import { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import Sidebar from '../components/Sidebar';
import Tabs from '../components/Tabs';
import StudentCard from '../components/StudentCard';
import { queryApi, healthCheck } from '../api/api';
import { students as mockStudents } from '../data/students';

export default function Home() {
  const [activeTab, setActiveTab] = useState('Все');
  const [activeFilters, setActiveFilters] = useState({
    courses: [],
    topics: [],
    places: []
  });
  const [sortBy, setSortBy] = useState('rating');
  const [students, setStudents] = useState(mockStudents);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Поиск через API при изменении фильтров
  useEffect(() => {
    const search = async () => {
      if (!searchQuery) {
        setStudents(mockStudents);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Проверка доступности бэкенда
        try {
          await healthCheck();
        } catch (err) {
          console.warn('Backend not available, using mock data');
          setStudents(mockStudents);
          setLoading(false);
          return;
        }

        // Запрос через process-query API (из Lev_back-end)
        const results = await queryApi.processQuery(searchQuery);
        // Конвертируем результаты в формат для карточек
        setStudents(results.map(r => ({
          id: r.user.id,
          name: r.user.full_name,
          course: `${r.user.course} курс`,
          faculty: r.user.department,
          bio: r.user.bio_raw,
          tags: r.user.tags_array || [],
          location: r.user.location_name,
          avatar: r.user.full_name.split(' ').map(n => n[0]).join('').toUpperCase(),
          avatarType: r.user.is_mentor ? 'olive' : 'deep',
          score: r.score
        })));
      } catch (err) {
        console.error('Search error:', err);
        setError('Не удалось выполнить поиск');
        setStudents(mockStudents);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(search, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredStudents = useMemo(() => {
    let result = [...students];
    
    // Filter by topics
    if (activeFilters.topics?.length > 0) {
      result = result.filter(student => {
        const hasTopic = student.tags_array?.some(tag => 
          activeFilters.topics.some(filter => 
            tag.toLowerCase().includes(filter.toLowerCase())
          )
        ) || student.bio_raw?.toLowerCase().includes(activeFilters.topics[0].toLowerCase());
        return hasTopic;
      });
    }
    
    // Filter by tabs
    if (activeTab !== 'Все') {
      result = result.filter(student => {
        if (activeTab === 'Академическая') return student.is_mentor;
        if (activeTab === 'Психология') return student.bio_raw?.toLowerCase().includes('псих');
        if (activeTab === 'Карьера') return student.bio_raw?.toLowerCase().includes('карьер');
        if (activeTab === 'Документы') return student.bio_raw?.toLowerCase().includes('документ');
        return true;
      });
    }
    
    // Sort
    if (sortBy === 'rating') {
      result.sort((a, b) => (b.trust_score || 0) - (a.trust_score || 0));
    } else {
      result.sort((a, b) => a.full_name.localeCompare(b.full_name));
    }
    
    return result;
  }, [students, activeFilters, activeTab, sortBy]);

  return (
    <div className="app">
      <Navbar />
      <Hero searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <Stats />

      <div className="layout">
        <Sidebar activeFilters={activeFilters} setActiveFilters={setActiveFilters} />

        <div className="grid-area">
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

          <div style={{ height: '1rem' }}></div>

          <div className="grid-top">
            <span className="grid-count">
              {loading ? 'Загрузка...' : `${filteredStudents.length} студентов`}
            </span>
            <button 
              className="sort-btn"
              onClick={() => setSortBy(sortBy === 'rating' ? 'name' : 'rating')}
            >
              По {sortBy === 'rating' ? 'рейтингу' : 'имени'} {sortBy === 'rating' ? '↓' : '↑'}
            </button>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9a939e' }}>
              Загрузка студентов...
            </div>
          )}

          {error && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#ac7674' }}>
              {error}
              <button onClick={loadStudents} className="btn-s" style={{ marginTop: '1rem' }}>
                Повторить
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="cards">
              {filteredStudents.map(student => (
                <StudentCard 
                  key={student.id} 
                  student={{
                    id: student.id || student.full_name,
                    name: student.full_name || student.name,
                    course: `${student.course || '1'} курс`,
                    faculty: student.department || student.faculty,
                    bio: student.bio_raw || student.bio,
                    tags: student.tags_array || student.tags || [],
                    location: student.location_name || student.location,
                    avatar: (student.full_name || student.name || '?').split(' ').map(n => n[0]).join('').toUpperCase(),
                    avatarType: student.is_mentor ? 'olive' : (student.trust_score || 0) > 3 ? 'blush' : 'deep'
                  }} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
