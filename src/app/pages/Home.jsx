import { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import Sidebar from '../components/Sidebar';
import Tabs from '../components/Tabs';
import StudentCard from '../components/StudentCard';
import { usersApi, healthCheck } from '../api/api';

export default function Home() {
  const [activeTab, setActiveTab] = useState('Все');
  const [activeFilters, setActiveFilters] = useState({
    courses: [],
    topics: [],
    places: []
  });
  const [sortBy, setSortBy] = useState('rating');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка студентов из API
  useEffect(() => {
    loadStudents();
  }, [activeFilters, activeTab]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Проверка доступности бэкенда
      try {
        await healthCheck();
      } catch (err) {
        console.warn('Backend not available, using mock data');
        // Используем моковые данные если бэкенд недоступен
        const mockData = await import('../data/students');
        setStudents(mockData.students);
        setLoading(false);
        return;
      }

      // Загрузка из API
      const params = {};
      if (activeFilters.courses?.length > 0) {
        params.course = parseInt(activeFilters.courses[0]);
      }
      if (activeFilters.places?.length > 0) {
        params.department = activeFilters.places[0];
      }
      
      const data = await usersApi.getUsers(params);
      setStudents(data);
    } catch (err) {
      console.error('Failed to load students:', err);
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

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
      <Hero />
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
                    id: student.id,
                    name: student.full_name,
                    course: `${student.course} курс`,
                    faculty: student.department,
                    bio: student.bio_raw,
                    tags: student.tags_array || [],
                    location: student.location_name,
                    avatar: student.full_name.split(' ').map(n => n[0]).join('').toUpperCase(),
                    avatarType: student.is_mentor ? 'olive' : student.trust_score > 3 ? 'blush' : 'deep'
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
