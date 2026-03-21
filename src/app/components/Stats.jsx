export default function Stats() {
  const stats = [
    { num: '48', label: 'студентов' },
    { num: '12', label: 'факультетов' },
    { num: '130+', label: 'тем' },
    { num: '4.9', label: 'рейтинг' }
  ];

  return (
    <div className="stats">
      {stats.map((stat, index) => (
        <div key={index} className="stat">
          <div className="stat-num">{stat.num}</div>
          <div className="stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
