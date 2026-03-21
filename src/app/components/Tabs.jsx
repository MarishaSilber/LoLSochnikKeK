import { tabs } from '../data/students';

export default function Tabs({ activeTab, setActiveTab }) {
  return (
    <div className="tabs">
      {tabs.map(tab => (
        <button 
          key={tab}
          className={`tab ${activeTab === tab ? 'on' : ''}`}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
