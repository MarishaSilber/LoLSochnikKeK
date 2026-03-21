import { useState } from 'react';

export default function Hero({ searchQuery, setSearchQuery }) {
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    // Поиск срабатывает через useEffect в Home.jsx
    setTimeout(() => setIsSearching(false), 500);
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
          disabled={isSearching}
        />
        <button type="submit" className="search-btn" disabled={isSearching}>
          {isSearching ? 'Поиск...' : 'Найти'}
        </button>
      </form>
    </div>
  );
}
