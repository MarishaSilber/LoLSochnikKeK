import { useState } from 'react'
import { Filter, X } from 'lucide-react'
import { cn } from '../lib/utils'

export default function Filters({ onFilterChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState({
    course: [],
    location: '',
    onlyActive: false,
  })
  
  const courses = [1, 2, 3, 4, 5, 6]
  const locations = [
    'ГЗ',
    'Физфак',
    'Лаборатория оптики',
    'Лаборатория фотоники',
    'Коворкинг',
    'Библиотека',
  ]
  
  const toggleCourse = (course) => {
    const newCourses = filters.course.includes(course)
      ? filters.course.filter(c => c !== course)
      : [...filters.course, course]
    
    const newFilters = { ...filters, course: newCourses }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }
  
  const handleLocationChange = (location) => {
    const newFilters = { ...filters, location }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }
  
  const handleActiveChange = (checked) => {
    const newFilters = { ...filters, onlyActive: checked }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }
  
  const clearFilters = () => {
    const newFilters = { course: [], location: '', onlyActive: false }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }
  
  const hasActiveFilters = filters.course.length > 0 || filters.location || filters.onlyActive
  
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Фильтры</h2>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Сбросить
          </button>
        )}
      </div>
      
      {/* Course Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Курс
        </label>
        <div className="flex flex-wrap gap-2">
          {courses.map((course) => (
            <button
              key={course}
              onClick={() => toggleCourse(course)}
              className={cn(
                "w-10 h-10 rounded-xl text-sm font-medium transition-all duration-200",
                filters.course.includes(course)
                  ? "bg-primary-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {course}
            </button>
          ))}
        </div>
      </div>
      
      {/* Location Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Локация
        </label>
        <select
          value={filters.location}
          onChange={(e) => handleLocationChange(e.target.value)}
          className="input"
        >
          <option value="">Все локации</option>
          {locations.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>
      
      {/* Only Active Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Только активные
        </label>
        <button
          onClick={() => handleActiveChange(!filters.onlyActive)}
          className={cn(
            "relative w-12 h-6 rounded-full transition-colors duration-200",
            filters.onlyActive ? "bg-primary-600" : "bg-gray-200"
          )}
        >
          <span
            className={cn(
              "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200",
              filters.onlyActive ? "left-7" : "left-1"
            )}
          />
        </button>
      </div>
    </div>
  )
}
