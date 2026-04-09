import { useNavigate } from 'react-router-dom';
import { formatCourseLabel } from '../utils/users';

export default function StudentCard({ student }) {
  const navigate = useNavigate();

  const getTagClass = (tag) => {
    if (['Отчисление', 'Диплом', 'Права', 'Разговор', 'Адаптация'].includes(tag)) {
      return 'ctag-b';
    }
    if (['Программирование', 'Статьи', 'Документы', 'Проектная практика'].includes(tag)) {
      return 'ctag-o';
    }
    return 'ctag-l';
  };

  return (
    <div className="card">
      <div className="card-head">
        <div className={`avatar av-${student.avatarType}`}>{student.avatar}</div>
        <div>
          <div className="card-name">{student.name}</div>
          <div className="card-sub">
            {formatCourseLabel(student.course)}
            {student.faculty ? ` · ${student.faculty}` : ''}
          </div>
        </div>
      </div>
      <div className="card-bio">{student.bio}</div>
      <div className="card-tags">
        {(student.tags || []).map((tag, index) => (
          <span key={index} className={`ctag ${getTagClass(tag)}`}>{tag}</span>
        ))}
      </div>
      <div className="card-loc">{student.location}</div>
      <div className="card-actions">
        <button className="btn-o" onClick={() => navigate(`/profile/${student.id}`)}>Профиль</button>
        <button className="btn-s" onClick={() => navigate(`/chat?targetUser=${student.id}`)}>Написать</button>
      </div>
    </div>
  );
}
