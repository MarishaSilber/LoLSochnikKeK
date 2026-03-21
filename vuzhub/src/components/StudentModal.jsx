import { X, MapPin, Calendar, Award, MessageSquare, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { cn } from '../lib/utils'

export default function StudentModal({ student, onClose }) {
  const {
    full_name,
    photo_url,
    course,
    department,
    location,
    bio,
    tags,
    is_mentor,
    trust_score,
    help_count,
    last_active,
    telegram_username,
    match_probability,
    match_reasons,
  } = student
  
  const matchPercent = Math.round(match_probability * 100)
  
  const getMatchColor = (percent) => {
    if (percent >= 90) return 'text-emerald-600 bg-emerald-50'
    if (percent >= 70) return 'text-lime-600 bg-lime-50'
    return 'text-gray-600 bg-gray-50'
  }
  
  const getTimeAgo = (date) => {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale: ru 
    })
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-lg font-semibold">Профиль студента</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Info */}
          <div className="flex items-start gap-4">
            <img
              src={photo_url}
              alt={full_name}
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-gray-100"
            />
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">{full_name}</h3>
              <p className="text-gray-500 mt-1">{course} курс • {department}</p>
              
              {match_probability !== undefined && (
                <div className={cn(
                  "mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold",
                  getMatchColor(matchPercent)
                )}>
                  <Award className="w-4 h-4" />
                  <span>Совпадение {matchPercent}%</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Match Reasons */}
          {match_reasons?.length > 0 && (
            <div className="bg-primary-50 rounded-2xl p-4">
              <h4 className="font-semibold text-primary-900 mb-2">Почему это совпадение:</h4>
              <div className="flex flex-wrap gap-2">
                {match_reasons.map((reason, index) => (
                  <span key={index} className="tag-match text-sm">
                    ✓ {reason}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Location & Activity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-gray-600">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Локация</p>
                <p className="font-medium">{location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Был в сети</p>
                <p className="font-medium">{getTimeAgo(last_active)}</p>
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-primary-600" />
                <div>
                  <p className="text-2xl font-bold text-primary-900">{trust_score || 0}</p>
                  <p className="text-sm text-primary-700">Рейтинг</p>
                </div>
              </div>
            </div>
            <div className="card bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold text-emerald-900">{help_count || 0}</p>
                  <p className="text-sm text-emerald-700">Помощей</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bio */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">О себе</h4>
            <p className="text-gray-600 leading-relaxed">{bio}</p>
          </div>
          
          {/* Tags */}
          {tags?.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Компетенции</h4>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span key={index} className="tag">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Status */}
          {is_mentor && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-emerald-700 font-medium">
                Активно ищет возможности помочь
              </span>
            </div>
          )}
        </div>
        
        {/* Actions Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-3xl space-y-3">
          <a
            href={`https://t.me/${telegram_username?.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Написать в Telegram</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          
          <button className="btn-secondary w-full">
            Найти на факультете
          </button>
        </div>
      </div>
    </div>
  )
}
