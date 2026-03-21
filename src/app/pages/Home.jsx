import { useState, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import Sidebar from '../components/Sidebar';
import Tabs from '../components/Tabs';
import StudentCard from '../components/StudentCard';
import { students, categoryTopics } from '../data/students';

export default function Home() {
  const [activeTab, setActiveTab] = useState('Все');
  const [activeFilters, setActiveFilters] = useState({
    courses: ['1'],
    topics: ['Отчисление', 'Диплом'],
    places: []
  });
  const [sortBy, setSortBy] = useState('name');

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
          if (course === '4+') return student.course.startsWith('4') || student.course === '5 курс';
          if (course === 'Маг.') return student.course.includes('Маг') || student.course.includes('Аспирантура');
          return student.course.startsWith(course + ' курс');
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
      const courseOrder = { '1': 1, '2': 2, '3': 3, '4': 4, '5': 4, 'Маг': 5, 'Аспирантура': 6 };
      result.sort((a, b) => {
        const aMatch = a.course.match(/(\d+|Маг|Аспирантура)/);
        const bMatch = b.course.match(/(\d+|Маг|Аспирантура)/);
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
      <Hero />
      <Stats />
      
      <div className="layout">
        <Sidebar activeFilters={activeFilters} setActiveFilters={setActiveFilters} />
        
        <div className="grid-area">
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <div style={{ height: '1rem' }}></div>
          
          <div className="grid-top">
            <span className="grid-count">{filteredStudents.length} студентов</span>
            <button
              className="sort-btn"
              onClick={() => setSortBy(sortBy === 'name' ? 'course' : 'name')}
            >
              По {sortBy === 'name' ? 'имени' : 'курсу'} {sortBy === 'name' ? '↑' : '↓'}
            </button>
          </div>
          
          <div className="cards">
            {filteredStudents.map(student => (
              <StudentCard key={student.id} student={student} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
