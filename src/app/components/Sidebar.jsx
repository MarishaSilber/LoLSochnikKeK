import { useState } from 'react';
import { filters } from '../data/students';

export default function Sidebar({ activeFilters, setActiveFilters }) {
  const toggleFilter = (category, value) => {
    setActiveFilters(prev => {
      const current = prev[category] || [];
      const updated = current.includes(value)
        ? current.filter(f => f !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const isActive = (category, value) => {
    return activeFilters[category]?.includes(value);
  };

  return (
    <div className="sidebar">
      <div className="filter-section">
        <span className="filter-label">Курс</span>
        <div className="filter-tags">
          {filters.courses.map(course => (
            <span
              key={course}
              className={`ftag olive ${isActive('courses', course) ? 'on' : ''}`}
              onClick={() => toggleFilter('courses', course)}
            >
              {course}
            </span>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <span className="filter-label">Тема</span>
        <div className="filter-tags">
          {filters.topics.map(topic => (
            <span
              key={topic}
              className={`ftag blush ${isActive('topics', topic) ? 'on' : ''}`}
              onClick={() => toggleFilter('topics', topic)}
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <span className="filter-label">Место</span>
        <div className="filter-tags">
          {filters.places.map(place => (
            <span 
              key={place}
              className={`ftag ${isActive('places', place) ? 'on' : ''}`}
              onClick={() => toggleFilter('places', place)}
            >
              {place}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
