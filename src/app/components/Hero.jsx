import { useState } from 'react';

export default function Hero({ searchQuery, setSearchQuery }) {
  const handleSearch = (e) => {
    e.preventDefault();
    // Поиск обрабатывается в Home.jsx через useEffect
  };

  return (
    <div className="hero">
      <h1>Найди поддержку<br />на <em>факультете</em></h1>
      <p>Студенческая платформа взаимопомощи</p>
      <form className="search-wrap" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="отчисление, Python, диплом..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit" className="search-btn">Найти</button>
      </form>
    </div>
  );
}
