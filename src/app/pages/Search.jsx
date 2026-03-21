import { useState } from 'react';
import Navbar from '../components/Navbar';
import StudentCard from '../components/StudentCard';
import { students } from '../data/students';

export default function Search() {
  const [query, setQuery] = useState('');
  
  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.bio.toLowerCase().includes(query.toLowerCase()) ||
    s.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="app">
      <Navbar />
      <div style={{ padding: '2rem', maxWidth: '1060px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '1.5rem', color: '#4a3d5c' }}>Поиск</h1>
        <input 
          type="text"
          placeholder="Поиск студентов..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: '100%', padding: '12px', border: '1px solid #e8e3db', borderRadius: '8px', fontFamily: 'TTWellingtons', marginBottom: '2rem' }}
        />
        <div className="cards">
          {filtered.map(student => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: '#9a939e', padding: '3rem' }}>Ничего не найдено</p>
        )}
      </div>
    </div>
  );
}
