import { useState } from 'react';

export default function Hero() {
  const [search, setSearch] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Search:', search);
  };

  return (
    <div className="hero">
      <h1>Найди поддержку<br />на <em>факультете</em></h1>
      <p>Студенческая платформа взаимопомощи</p>
      <form className="search-wrap" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="отчисление, Python, диплом..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="search-btn">Найти</button>
      </form>
    </div>
  );
}
