import React from 'react';
import { 
  IoHomeOutline, IoHome, 
  IoSearchOutline, IoSearch, 
  IoLibraryOutline, IoLibrary, 
  IoSettingsOutline, IoSettings, 
  IoMusicalNotes 
} from 'react-icons/io5';
import './Sidebar.css';

const Sidebar = ({ currentView, setCurrentView }) => {
  return (
    <aside className="sidebar glass-panel">
      <div className="logo">
        <div className="logo-icon">
          <IoMusicalNotes size={24} color="#0f172a" />
        </div>
        <h2>Tuneify</h2>
      </div>
      
      <nav className="nav-menu">
        <button 
          className={`nav-item ${currentView === 'home' ? 'active' : ''}`}
          onClick={() => setCurrentView('home')}
        >
          {currentView === 'home' ? <IoHome size={22} /> : <IoHomeOutline size={22} />}
          <span>Home</span>
        </button>
        <button 
          className={`nav-item ${currentView === 'search' ? 'active' : ''}`}
          onClick={() => setCurrentView('search')}
        >
          {currentView === 'search' ? <IoSearch size={22} /> : <IoSearchOutline size={22} />}
          <span>Search</span>
        </button>
        
        <div className="nav-divider"></div>
        
        <button 
          className={`nav-item ${currentView === 'library' ? 'active' : ''}`}
          onClick={() => setCurrentView('library')}
        >
          {currentView === 'library' ? <IoLibrary size={22} /> : <IoLibraryOutline size={22} />}
          <span>Library</span>
        </button>
        <button 
          className={`nav-item ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentView('settings')}
        >
          {currentView === 'settings' ? <IoSettings size={22} /> : <IoSettingsOutline size={22} />}
          <span>Settings</span>
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
