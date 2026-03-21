import { useState } from 'react'
import { Camera, MapPin, Tag, Save } from 'lucide-react'
import { mockCurrentUser } from '../lib/mockData'

export default function ProfilePage() {
  const [profile, setProfile] = useState(mockCurrentUser)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(profile)
  
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  const handleSave = () => {
    setProfile(formData)
    setIsEditing(false)
    // Здесь будет вызов API для сохранения
  }
  
  const handleCancel = () => {
    setFormData(profile)
    setIsEditing(false)
  }
  
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Мой профиль</h1>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="btn-primary">
            Редактировать
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleCancel} className="btn-secondary">
              Отмена
            </button>
            <button onClick={handleSave} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              Сохранить
            </button>
          </div>
        )}
      </div>
      
      {/* Avatar */}
      <div className="card">
        <div className="flex items-center gap-6">
          <div className="relative">
            <img
              src={formData.photo_url}
              alt="Аватар"
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-gray-100"
            />
            {isEditing && (
              <button className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{formData.full_name}</h2>
            <p className="text-gray-500">{formData.course} курс • {formData.department}</p>
            {isEditing && (
              <p className="text-sm text-primary-600 mt-2">
                Нажмите на камеру, чтобы изменить фото
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Personal Info */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-900">Личная информация</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ФИО
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              className="input"
            />
          ) : (
            <p className="text-gray-900">{formData.full_name}</p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Курс
            </label>
            {isEditing ? (
              <select
                value={formData.course}
                onChange={(e) => handleChange('course', parseInt(e.target.value))}
                className="input"
              >
                {[1, 2, 3, 4, 5, 6].map(c => (
                  <option key={c} value={c}>{c} курс</option>
                ))}
              </select>
            ) : (
              <p className="text-gray-900">{formData.course} курс</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telegram
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.telegram_username}
                onChange={(e) => handleChange('telegram_username', e.target.value)}
                className="input"
                placeholder="@username"
              />
            ) : (
              <p className="text-gray-900">{formData.telegram_username}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Location */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Локация</h3>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Где вы обычно находитесь?
          </label>
          {isEditing ? (
            <select
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="input"
            >
              <option value="ГЗ">ГЗ (Главное здание)</option>
              <option value="Физфак">Физфак</option>
              <option value="Лаборатория оптики">Лаборатория оптики</option>
              <option value="Лаборатория фотоники">Лаборатория фотоники</option>
              <option value="Коворкинг">Коворкинг</option>
              <option value="Библиотека">Библиотека</option>
            </select>
          ) : (
            <p className="text-gray-900">{formData.location}</p>
          )}
        </div>
      </div>
      
      {/* Bio */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-900">О себе</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Расскажите, чем можете помочь или какая помощь нужна
          </label>
          {isEditing ? (
            <textarea
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              rows={5}
              className="input resize-none"
              placeholder="Например: Помогаю с лабораторными по оптике, сам проходил пересдачу..."
            />
          ) : (
            <p className="text-gray-900 whitespace-pre-wrap">{formData.bio}</p>
          )}
        </div>
        
        {isEditing && (
          <div className="bg-primary-50 rounded-xl p-4">
            <p className="text-sm text-primary-700">
              💡 <strong>Совет:</strong> Чем подробнее опишете свой опыт, тем точнее система подберёт вам людей
            </p>
          </div>
        )}
      </div>
      
      {/* Tags */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Компетенции</h3>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag, index) => (
            <span key={index} className="tag">
              #{tag}
              {isEditing && (
                <button
                  onClick={() => {
                    const newTags = formData.tags.filter((_, i) => i !== index)
                    handleChange('tags', newTags)
                  }}
                  className="ml-1 hover:text-red-600"
                >
                  ×
                </button>
              )}
            </span>
          ))}
          {isEditing && (
            <button className="px-3 py-1 rounded-full text-sm border-2 border-dashed border-gray-300 text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors">
              + Добавить тег
            </button>
          )}
        </div>
        
        {isEditing && (
          <p className="text-sm text-gray-500">
            Теги автоматически извлекаются из описания, но вы можете добавить свои
          </p>
        )}
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-200 rounded-xl flex items-center justify-center">
              <span className="text-primary-700 font-bold">★</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-900">{profile.trust_score}</p>
              <p className="text-sm text-primary-700">Рейтинг</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-200 rounded-xl flex items-center justify-center">
              <span className="text-emerald-700 font-bold">✓</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-900">{profile.help_count}</p>
              <p className="text-sm text-emerald-700">Помощей</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
