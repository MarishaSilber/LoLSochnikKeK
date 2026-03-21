export default function StudentCard({ student }) {
  const getTagClass = (tag) => {
    const tagLower = tag.toLowerCase();
    if (['отчисление', 'академка', 'диплом', 'курсовая', 'права', 'разговор'].some(t => tagLower.includes(t))) {
      return 'ctag-b';
    }
    if (['python', 'ml', 'статьи', 'документы'].some(t => tagLower.includes(t))) {
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
          <div className="card-sub">{student.course}{student.faculty ? ` · ${student.faculty}` : ''}</div>
        </div>
      </div>
      <div className="card-bio">{student.bio}</div>
      <div className="card-tags">
        {student.tags.map((tag, index) => (
          <span key={index} className={`ctag ${getTagClass(tag)}`}>{tag}</span>
        ))}
      </div>
      <div className="card-loc">{student.location}</div>
      <div className="card-actions">
        <button className="btn-o" onClick={() => console.log('Profile:', student.id)}>Профиль</button>
        <button className="btn-s" onClick={() => console.log('Message:', student.id)}>Написать</button>
      </div>
    </div>
  );
}
