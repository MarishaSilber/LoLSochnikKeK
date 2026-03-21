import { useState, useEffect } from 'react'
import { Search, Sparkles, X } from 'lucide-react'
import { useDebounce } from '../hooks/useDebounce'

export default function SearchBar({ onSearch, isLoading }) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 500)
  const [isAiProcessing, setIsAiProcessing] = useState(false)
  
  useEffect(() => {
    if (debouncedQuery) {
      setIsAiProcessing(true)
      const timer = setTimeout(() => {
        setIsAiProcessing(false)
        onSearch?.(debouncedQuery)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [debouncedQuery, onSearch])
  
  const handleClear = () => {
    setQuery('')
    onSearch?.('')
  }
  
  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <div className={`relative group transition-all duration-300 ${
        isAiProcessing ? 'ring-2 ring-primary-400' : ''
      }`}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Например: Как не вылететь из-за матана на 2 курсе?"
          className="w-full pl-12 pr-12 py-4 text-lg rounded-2xl border-2 border-gray-200 
                     focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10
                     transition-all duration-200 bg-white"
        />
        
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 
                       hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        {/* AI Indicator */}
        <div className="absolute right-12 top-1/2 -translate-y-1/2">
          {isAiProcessing && (
            <Sparkles className="w-5 h-5 text-primary-500 animate-pulse" />
          )}
        </div>
      </div>
      
      {/* AI Processing Status */}
      {isAiProcessing && (
        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-primary-600">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>Анализируем запрос...</span>
        </div>
      )}
      
      {/* Quick Suggestions */}
      {!query && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm text-gray-500">Популярное:</span>
          <QuickSuggestion text="Поиск работы на 2 курсе" onClick={() => setQuery('Поиск работы на 2 курсе')} />
          <QuickSuggestion text="Помощь с лабой по оптике" onClick={() => setQuery('Помощь с лабой по оптике')} />
          <QuickSuggestion text="Как перевестись на бюджет" onClick={() => setQuery('Как перевестись на бюджет')} />
        </div>
      )}
    </div>
  )
}

function QuickSuggestion({ text, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-full 
                 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 
                 transition-colors duration-200"
    >
      {text}
    </button>
  )
}
