import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import ScrollingText from './ScrollingText';
import { Search as SearchIcon, Play, Clock, X, ArrowLeft } from 'lucide-react';
import './SearchView.css';

const SearchView = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [viewAllCategory, setViewAllCategory] = useState(null);
  const { playSong, setIsFullScreen, formatTime } = usePlayer();

  useEffect(() => {
    try {
      const hist = localStorage.getItem('tuneify_search_history');
      if (hist) setSearchHistory(JSON.parse(hist));
    } catch(e) {}
  }, []);

  const saveToHistory = (term) => {
    if (!term || term.trim().length < 3) return;
    try {
      let currentHist = [...searchHistory];
      currentHist = currentHist.filter(t => t.toLowerCase() !== term.toLowerCase());
      currentHist.unshift(term);
      if (currentHist.length > 10) currentHist.pop();
      setSearchHistory(currentHist);
      localStorage.setItem('tuneify_search_history', JSON.stringify(currentHist));
    } catch(e) {}
  };

  const removeFromHistory = (term, e) => {
    e.stopPropagation();
    const newHist = searchHistory.filter(t => t !== term);
    setSearchHistory(newHist);
    localStorage.setItem('tuneify_search_history', JSON.stringify(newHist));
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length > 2) {
        setViewAllCategory(null);
        searchSongs(query);
      } else {
        setResults([]);
        setViewAllCategory(null);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const searchSongs = async (searchQuery) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://tuneifymusic2-fy4dlefd.b4a.run/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        saveToHistory(searchQuery); // Save history on successful search
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderCategory = (title, allItems, type, isViewAll = false) => {
    if (!allItems || allItems.length === 0) return null;
    
    const items = isViewAll ? allItems : allItems.slice(0, 8);

    return (
      <div className="search-category">
        <div className="category-header">
          <h2>{title}</h2>
          {!isViewAll && (
            <button 
              className="view-all-btn" 
              onClick={() => {
                setViewAllCategory(type);
                const mainContent = document.querySelector('.main-content');
                if (mainContent) {
                  mainContent.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            >
              View all
            </button>
          )}
        </div>
        <div className="category-list">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="list-item glass-panel-interactive"
              onClick={() => {
                if(item.type === 'song' || item.type === 'video') {
                  playSong(item, true, 'Random Selection');
                  setIsFullScreen(true);
                }
              }}
            >
              <img 
                src={item.thumbnailUrl} 
                alt={item.title} 
                className={item.type === 'artist' ? 'artist-img' : 'cover-img'}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = item.type === 'artist' ? 'https://via.placeholder.com/60?text=Artist' : `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;
                }}
              />
              <div className="list-item-info">
                <ScrollingText text={item.title} textClass="search-list-title" />
                <p className="text-muted text-truncate">
                  {item.type === 'artist' ? item.artist : `${item.type === 'video' ? 'Video' : 'Song'} • ${item.artist}`}
                </p>
              </div>
              {item.duration ? <div className="text-muted" style={{ fontSize: '0.85rem', paddingRight: '12px' }}>{formatTime(item.duration)}</div> : null}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="search-view">
      <div className="search-header sticky">
        <div className="search-input-container glass-panel">
          <SearchIcon size={20} className="text-muted" />
          <input 
            type="text" 
            placeholder="Search for songs, artists, or albums..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query.length > 0 && (
            <button 
              className="icon-btn" 
              onClick={() => { setQuery(''); setResults([]); }}
              style={{ padding: '4px' }}
            >
              <X size={20} className="text-muted" />
            </button>
          )}
        </div>
      </div>

      <div className="search-results">
        {isLoading && <div className="loading-state">Searching your universe...</div>}
        
        {/* Search History Display */}
        {!isLoading && query.trim().length <= 2 && searchHistory.length > 0 && (
          <div className="search-history-section">
            <h3 style={{marginBottom: '16px', fontSize: '1.2rem'}}>Recent Searches</h3>
            <div className="history-list">
              {searchHistory.map((term, i) => (
                <div key={i} className="history-item glass-panel-interactive" onClick={() => setQuery(term)}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <Clock size={18} className="text-muted" />
                    <span>{term}</span>
                  </div>
                  <button className="icon-btn text-muted" onClick={(e) => removeFromHistory(term, e)}>
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && results && (results.songs || results.artists || results.videos) && (
          <div className="search-categories">
            {viewAllCategory ? (
              <>
                <button 
                  onClick={() => setViewAllCategory(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '16px', fontSize: '1rem', padding: 0 }}
                >
                  <ArrowLeft size={20} />
                  <span>Back to search results</span>
                </button>
                {viewAllCategory === 'songs' && renderCategory('Songs', results.songs, 'songs', true)}
                {viewAllCategory === 'artists' && renderCategory('Artists', results.artists, 'artists', true)}
                {viewAllCategory === 'videos' && renderCategory('Videos', results.videos, 'videos', true)}
                {viewAllCategory === 'albums' && renderCategory('Albums', results.albums, 'albums', true)}
              </>
            ) : (
              <>
                {renderCategory('Songs', results.songs, 'songs')}
                {renderCategory('Artists', results.artists, 'artists')}
                {renderCategory('Videos', results.videos, 'videos')}
                {renderCategory('Albums', results.albums, 'albums')}
              </>
            )}
          </div>
        )}
        
        {!isLoading && query.length > 2 && (!results.songs || results.songs.length === 0) && (!results.artists || results.artists.length === 0) && (
          <div className="loading-state text-muted">No results found for "{query}"</div>
        )}
      </div>
    </div>
  );
};

export default SearchView;
