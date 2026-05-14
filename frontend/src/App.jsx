import React, { useState } from 'react';
import { PlayerProvider } from './context/PlayerContext';
import Player from './components/Player';
import Sidebar from './components/Sidebar';
import HomeFeed from './components/HomeFeed';
import SearchView from './components/SearchView';
import LibraryView from './components/LibraryView';
import SettingsView from './components/SettingsView';
import Toast from './components/Toast';

function App() {
  const [currentView, setCurrentView] = useState('home');

  return (
    <PlayerProvider>
      <div className="app-layout">
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
        <main className="main-content glass-panel">
          {currentView === 'home'     && <HomeFeed />}
          {currentView === 'search'   && <SearchView />}
          {currentView === 'library'  && <LibraryView setCurrentView={setCurrentView} />}
          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>
      <Player />
      <Toast />
    </PlayerProvider>
  );
}

export default App;
