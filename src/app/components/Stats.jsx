import { students, filters } from '../data/students';

export default function Stats() {
  const studentCount = students.length;
  const topicCount = filters.topics.length;
  const helpedCount = 87;

  return (
    <div className="stats">
      <div className="stat">
        <div className="stat-num">{studentCount}</div>
        <div className="stat-label">студентов</div>
      </div>
      <div className="stat">
        <div className="stat-num">{topicCount}</div>
        <div className="stat-label">тем</div>
      </div>
      <div className="stat">
        <div className="stat-num">{helpedCount}</div>
        <div className="stat-label">получили помощь</div>
      </div>
    </div>
  );
}
