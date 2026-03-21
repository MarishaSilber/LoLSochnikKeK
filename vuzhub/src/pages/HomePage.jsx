import { useState } from 'react'
import SearchBar from '../components/SearchBar'
import Filters from '../components/Filters'
import StudentCard from '../components/StudentCard'
import StudentModal from '../components/StudentModal'
import { mockStudents } from '../lib/mockData'
import { Users, SlidersHorizontal } from 'lucide-react'
import { cn } from '../lib/utils'

export default function HomePage() {
  const [students, setStudents] = useState(mockStudents)
  const [filteredStudents, setFilteredStudents] = useState(mockStudents)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSearch = (query) => {
    setIsLoading(true)
    
    // Имитация поиска
    setTimeout(() => {
      if (!query) {
        setFilteredStudents(mockStudents)
      } else {
        const filtered = mockStudents.filter(student =>
          student.full_name.toLowerCase().includes(query.toLowerCase()) ||
          student.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
          student.bio.toLowerCase().includes(query.toLowerCase())
        )
        setFilteredStudents(filtered)
      }
      setIsLoading(false)
    }, 500)
  }
  
  const handleFilterChange = (filters) => {
    let filtered = [...mockStudents]
    
    if (filters.course.length > 0) {
      filtered = filtered.filter(s => filters.course.includes(s.course))
    }
    
    if (filters.location) {
      filtered = filtered.filter(s => 
        s.location.toLowerCase().includes(filters.location.toLowerCase())
      )
    }
    
    if (filters.onlyActive) {
      filtered = filtered.filter(s => s.is_mentor)
    }
    
    setFilteredStudents(filtered)
  }
  
  return (
    <div className="space-y-6">
      {/* Search Section */}
      <section className="text-center py-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Найди помощь на факультете
        </h1>
        <p className="text-gray-500 mb-6">
          Умный поиск студентов, которые могут помочь
        </p>
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
      </section>
      
      {/* Mobile Filter Toggle */}
      <div className="md:hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full btn-secondary flex items-center justify-center gap-2"
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span>Фильтры</span>
        </button>
      </div>
      
      {/* Main Content */}
      <div className="flex gap-6">
        {/* Sidebar Filters - Desktop */}
        <aside className={cn(
          "w-64 flex-shrink-0 space-y-4",
          "hidden md:block"
        )}>
          <Filters onFilterChange={handleFilterChange} />
        </aside>
        
        {/* Mobile Filters */}
        {showFilters && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowFilters(false)}>
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-gray-50 p-4 overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Фильтры</h2>
                <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-gray-200 rounded-lg">
                  <SlidersHorizontal className="w-5 h-5" />
                </button>
              </div>
              <Filters onFilterChange={handleFilterChange} />
            </div>
          </div>
        )}
        
        {/* Results Grid */}
        <div className="flex-1">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-gray-500">
              <Users className="w-5 h-5" />
              <span>{filteredStudents.length} результатов</span>
            </div>
          </div>
          
          {/* Loading State */}
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-2xl"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Никого не найдено
              </h3>
              <p className="text-gray-500 mb-4">
                Попробуйте изменить запрос или снять фильтры
              </p>
              <button className="btn-primary" onClick={() => handleSearch('')}>
                Показать всех
              </button>
            </div>
          ) : (
            /* Results */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredStudents.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onClick={setSelectedStudent}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  )
}
