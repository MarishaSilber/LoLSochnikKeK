import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StudentCard from '../components/StudentCard';
import SiteFooter from '../components/SiteFooter';
import { healthCheck, searchApi, usersApi } from '../api/api';
import { students as mockStudents } from '../data/students';
import { mapUserToCard } from '../utils/users';

export default function Home() {
  const [activeFilters, setActiveFilters] = useState({
    courses: [],
    topics: [],
    places: [],
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadAllUsers = async () => {
    const data = await usersApi.getAllUsers();
    setStudents(data.map(mapUserToCard));
  };

  useEffect(() => {
    const loadStudents = async () => {
      try {
        await healthCheck();
        await loadAllUsers();
      } catch {
        setStudents(mockStudents);
      }
    };

    loadStudents();
  }, []);

  useEffect(() => {
    const search = async () => {
      if (!searchQuery.trim()) {
        try {
          await loadAllUsers();
        } catch {
          setStudents(mockStudents);
        }
        return;
      }

      setLoading(true);
      try {
        const results = await searchApi.searchUsers(searchQuery);
        setStudents(results.map(mapUserToCard));
      } catch {
        const normalizedQuery = searchQuery.toLowerCase();
        const filtered = mockStudents.filter((student) =>
          student.name.toLowerCase().includes(normalizedQuery) ||
          student.bio.toLowerCase().includes(normalizedQuery) ||
          (student.tags || []).some((tag) => tag.toLowerCase().includes(normalizedQuery))
        );
        setStudents(filtered);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(search, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      if (activeFilters.courses?.length > 0) {
        const hasCourse = activeFilters.courses.some((course) => {
          const normalizedCourse = String(student.course);
          if (course === '4+') {
            return ['4', '5', '6'].includes(normalizedCourse);
          }
          if (course === 'Маг.') {
            return ['5', '6'].includes(normalizedCourse);
          }
          return normalizedCourse === course;
        });

        if (!hasCourse) {
          return false;
        }
      }

      if (activeFilters.topics?.length > 0) {
        const hasTopic = (student.tags || []).some((tag) =>
          activeFilters.topics.some((filter) => tag.toLowerCase().includes(filter.toLowerCase()))
        );

        if (!hasTopic) {
          return false;
        }
      }

      if (activeFilters.places?.length > 0) {
        const hasPlace = activeFilters.places.some(
          (place) => student.location && student.location.toLowerCase().includes(place.toLowerCase())
        );

        if (!hasPlace) {
          return false;
        }
      }

      return true;
    });
  }, [activeFilters, students]);

  return (
    <div className="app">
      <Navbar />
      <div className="page-content">
        <div className="hero">
          <h1>
            Найди поддержку
            <br />
            <em>на факультете</em>
          </h1>
          <p>Студенческая платформа взаимопомощи</p>
          <form className="search-wrap" onSubmit={(event) => event.preventDefault()}>
            <input
              type="text"
              placeholder="отчисление, Python, диплом..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <button type="submit" className="search-btn">
              Найти
            </button>
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
              {filteredStudents.map((student) => (
                <StudentCard key={student.id} student={student} />
              ))}
            </div>

            {filteredStudents.length === 0 && !loading && (
              <p className="no-results">Ничего не найдено</p>
            )}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
