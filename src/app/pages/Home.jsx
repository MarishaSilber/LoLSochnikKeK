import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StudentCard from '../components/StudentCard';
import { searchApi, usersApi, healthCheck } from '../api/api';
import { students as mockStudents, filters } from '../data/students';

export default function Home() {
  const navigate = useNavigate();
  const [activeFilters, setActiveFilters] = useState({
    courses: [],
    topics: [],
    places: []
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Загрузка всех студентов при старте
  useEffect(() => {
    const loadStudents = async () => {
      try {
        await healthCheck();
        const data = await usersApi.getAllUsers();
        setStudents(data.map(u => ({
          id: u.id,
          name: u.full_name,
          course: u.course || 1,
          faculty: u.department,
          bio: u.bio_raw,
          tags: u.tags_array || [],
          location: u.location_name,
          avatar: u.full_name.split(' ').map(n => n[0]).join('').toUpperCase(),
          avatarType: 'olive'
        })));
      } catch (err) {
        console.warn('Backend unavailable, using mock data');
        setStudents(mockStudents);
      }
    };
    loadStudents();
  }, []);

  // Поиск через LLM
  useEffect(() => {
    const search = async () => {
      if (!searchQuery.trim()) {
        // Возвращаем всех при пустом запросе
        try {
          const data = await usersApi.getAllUsers();
          setStudents(data.map(u => ({
            id: u.id,
            name: u.full_name,
            course: u.course || 1,
            faculty: u.department,
            bio: u.bio_raw,
            tags: u.tags_array || [],
            location: u.location_name,
            avatar: u.full_name.split(' ').map(n => n[0]).join('').toUpperCase(),
            avatarType: 'olive'
          })));
        } catch {
          setStudents(mockStudents);
        }
        return;
      }

      setLoading(true);
      try {
        const results = await searchApi.searchUsers(searchQuery);
        setStudents(results.map(u => ({
          id: u.id,
          name: u.full_name,
          course: u.course || 1,
          faculty: u.department,
          bio: u.bio_raw,
          tags: u.tags_array || [],
          location: u.location_name,
          avatar: u.full_name.split(' ').map(n => n[0]).join('').toUpperCase(),
          avatarType: 'olive'
        })));
      } catch (err) {
        console.warn('LLM search failed, using local filter');
        // Fallback к локальному поиску
        const filtered = mockStudents.filter(s =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.tags && s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
        );
        setStudents(filtered);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(search, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Фильтрация
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Курс
      if (activeFilters.courses?.length > 0) {
        const hasCourse = activeFilters.courses.some(course => {
          const c = String(student.course);
          if (course === '4+') return c === '4' || c === '5' || c === '6';
          if (course === 'Маг.') return c === '5' || c === '6';
          return c === course;
        });
        if (!hasCourse) return false;
      }

      // Темы
      if (activeFilters.topics?.length > 0) {
        const hasTopic = student.tags.some(tag =>
          activeFilters.topics.some(filter =>
            tag.toLowerCase().includes(filter.toLowerCase())
          )
        );
        if (!hasTopic) return false;
      }

      // Место
      if (activeFilters.places?.length > 0) {
        const hasPlace = activeFilters.places.some(place =>
          student.location && student.location.toLowerCase().includes(place.toLowerCase())
        );
        if (!hasPlace) return false;
      }

      return true;
    });
  }, [activeFilters, students]);

  return (
    <div className="app">
      <Navbar />
      
      {/* Hero секция с поиском */}
      <div className="hero">
        <h1>Найди поддержку<br /><em>на факультете</em></h1>
        <p>Студенческая платформа взаимопомощи</p>
        <form className="search-wrap" onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            placeholder="отчисление, Python, диплом..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-btn">Найти</button>
        </form>
      </div>

      <div className="layout">
        <Sidebar activeFilters={activeFilters} setActiveFilters={setActiveFilters} />

        <div className="grid-area">
          <div className="grid-top">
            <span className="grid-count">
              {loading ? 'Загрузка...' : `${filteredStudents.length} студентов`}
            </span>
          </div>

          <div className="cards">
            {filteredStudents.map(student => (
              <StudentCard 
                key={student.id} 
                student={{
                  id: student.id,
                  name: student.name,
                  course: `${student.course} курс`,
                  faculty: student.faculty,
                  bio: student.bio,
                  tags: student.tags,
                  location: student.location,
                  avatar: student.avatar,
                  avatarType: student.avatarType
                }} 
              />
            ))}
          </div>

          {filteredStudents.length === 0 && !loading && (
            <p className="no-results">Ничего не найдено</p>
          )}
        </div>
      </div>
    </div>
  );
}
