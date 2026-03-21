import { MapPin, Clock, MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { cn } from '../lib/utils'

export default function StudentCard({ student, onClick }) {
  const {
    full_name,
    photo_url,
    course,
    department,
    location,
    tags,
    is_mentor,
    last_active,
    match_probability,
    match_reasons,
  } = student
  
  const matchPercent = Math.round(match_probability * 100)
  
  const getMatchColor = (percent) => {
    if (percent >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    if (percent >= 70) return 'text-lime-600 bg-lime-50 border-lime-200'
    return 'text-gray-600 bg-gray-50 border-gray-200'
  }
  
  const getTimeAgo = (date) => {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale: ru 
    })
  }
  
  return (
    <div 
      onClick={() => onClick?.(student)}
      className="card cursor-pointer group hover:border-primary-200"
    >
      <div className="flex items-start gap-4">
        {/* Photo */}
        <div className="relative flex-shrink-0">
          <img
            src={photo_url}
            alt={full_name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-gray-100 group-hover:ring-primary-200 transition-all"
          />
          {is_mentor && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                {full_name}
              </h3>
              <p className="text-sm text-gray-500">{course} курс • {department}</p>
            </div>
            
            {/* Match Probability */}
            {match_probability !== undefined && (
              <div className={cn(
                "flex-shrink-0 px-3 py-1 rounded-full text-sm font-semibold border",
                getMatchColor(matchPercent)
              )}>
                {matchPercent}%
              </div>
            )}
          </div>
          
          {/* Location */}
          <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{location}</span>
          </div>
          
          {/* Last Active */}
          <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{getTimeAgo(last_active)}</span>
          </div>
          
          {/* Tags */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags?.slice(0, 5).map((tag, index) => (
              <span 
                key={index}
                className="tag text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
          
          {/* Match Reasons */}
          {match_reasons?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {match_reasons.slice(0, 3).map((reason, index) => (
                <span 
                  key={index}
                  className="tag-match text-xs"
                >
                  ✓ {reason}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Action Button */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <button className="w-full btn-primary flex items-center justify-center gap-2">
          <MessageSquare className="w-4 h-4" />
          <span>Написать</span>
        </button>
      </div>
    </div>
  )
}
