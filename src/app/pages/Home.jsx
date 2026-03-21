import { useState, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import Sidebar from '../components/Sidebar';
import Tabs from '../components/Tabs';
import StudentCard from '../components/StudentCard';
import { students } from '../data/students';

export default function Home() {
  const [activeTab, setActiveTab] = useState('Все');
  const [activeFilters, setActiveFilters] = useState({
    courses: ['1'],
    topics: ['Отчисление', 'Диплом'],
    places: []
  });
  const [sortBy, setSortBy] = useState('rating');

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Filter by topics
      if (activeFilters.topics?.length > 0) {
        const hasTopic = student.tags.some(tag => 
          activeFilters.topics.some(filter => 
            tag.toLowerCase().includes(filter.toLowerCase())
          )
        );
        if (!hasTopic) return false;
      }
      return true;
    });
  }, [activeFilters]);

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
              onClick={() => setSortBy(sortBy === 'rating' ? 'name' : 'rating')}
            >
              По {sortBy === 'rating' ? 'рейтингу' : 'имени'} {sortBy === 'rating' ? '↓' : '↑'}
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
