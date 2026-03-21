import { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import Sidebar from '../components/Sidebar';
import Tabs from '../components/Tabs';
import StudentCard from '../components/StudentCard';
import { queryApi, healthCheck } from '../api/api';
import { students as allStudents, categoryTopics } from '../data/students';

export default function Home() {
  const [activeTab, setActiveTab] = useState('Все');
  const [activeFilters, setActiveFilters] = useState({
    courses: ['1'],
    topics: ['Отчисление', 'Диплом'],
    places: []
  });
  const [sortBy, setSortBy] = useState('name');
  const [students, setStudents] = useState(allStudents);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Поиск через API при изменении поискового запроса
  useEffect(() => {
    const search = async () => {
      if (!searchQuery.trim()) {
        return;
      }

      try {
        setLoading(true);
        await healthCheck();
        const results = await queryApi.processQuery(searchQuery);
        setStudents(results.map(r => ({
          id: r.user.id,
          name: r.user.full_name,
          course: `${r.user.course} курс`,
          faculty: r.user.department,
          bio: r.user.bio_raw,
          tags: r.user.tags_array || [],
          location: r.user.location_name,
          avatar: r.user.full_name.split(' ').map(n => n[0]).join('').toUpperCase(),
          avatarType: r.user.is_mentor ? 'olive' : 'deep'
        })));
      } catch (err) {
        console.warn('Backend search not available');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(search, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredStudents = useMemo(() => {
    const categoryTags = categoryTopics[activeTab] || [];
    
    let result = students.filter(student => {
      // Filter by category tab
      if (categoryTags.length > 0) {
        const hasCategoryTag = student.tags.some(tag =>
          categoryTags.includes(tag)
        );
        if (!hasCategoryTag) return false;
      }
      
      // Filter by courses
      if (activeFilters.courses?.length > 0) {
        const hasCourse = activeFilters.courses.some(course => {
          if (course === '4+') return student.course.startsWith('4') || student.course === '5 курс' || student.course === '6 курс';
          if (course === 'Маг.') return String(student.course).includes('Маг') || String(student.course).includes('9') || String(student.course).includes('10');
          return String(student.course).startsWith(course);
        });
        if (!hasCourse) return false;
      }
      
      // Filter by topics
      if (activeFilters.topics?.length > 0) {
        const hasTopic = student.tags.some(tag =>
          activeFilters.topics.some(filter =>
            tag.toLowerCase().includes(filter.toLowerCase())
          )
        );
        if (!hasTopic) return false;
      }
      
      // Filter by places
      if (activeFilters.places?.length > 0) {
        const hasPlace = activeFilters.places.some(place =>
          student.location.includes(place)
        );
        if (!hasPlace) return false;
      }
      return true;
    });
    
    // Sort
    if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'course') {
      const courseOrder = { '1': 1, '2': 2, '3': 3, '4': 4, '5': 4, '6': 4, 'Маг': 5, 'Аспирантура': 6 };
      result.sort((a, b) => {
        const aMatch = String(a.course).match(/(\d+|Маг|Аспирантура)/);
        const bMatch = String(b.course).match(/(\d+|Маг|Аспирантура)/);
        const aOrder = aMatch ? courseOrder[aMatch[1]] || 99 : 99;
        const bOrder = bMatch ? courseOrder[bMatch[1]] || 99 : 99;
        return aOrder - bOrder;
      });
    }
    
    return result;
  }, [activeFilters, activeTab, sortBy]);

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
            <span className="grid-count">{loading ? 'Загрузка...' : `${filteredStudents.length} студентов`}</span>
            <button
              className="sort-btn"
              onClick={() => setSortBy(sortBy === 'name' ? 'course' : 'name')}
            >
              По {sortBy === 'name' ? 'имени' : 'курсу'} {sortBy === 'name' ? '↑' : '↓'}
            </button>
          </div>
          
          <div className="cards">
            {filteredStudents.map(student => (
              <StudentCard key={student.id} student={{
                id: student.id,
                name: student.name || student.full_name,
                course: `${student.course || '1'} курс`,
                faculty: student.faculty || student.department,
                bio: student.bio || student.bio_raw,
                tags: student.tags || student.tags_array || [],
                location: student.location || student.location_name,
                avatar: student.avatar || (student.full_name || student.name || '?').split(' ').map(n => n[0]).join('').toUpperCase(),
                avatarType: student.avatarType || (student.is_mentor ? 'olive' : 'deep')
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
