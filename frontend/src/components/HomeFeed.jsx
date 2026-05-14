import React, { useState, useEffect } from 'react';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import ScrollingText from './ScrollingText';
import { usePlayer } from '../context/PlayerContext';
import './HomeFeed.css';

const HorizontalList = ({ title, items, playSong, setIsFullScreen }) => {
  const scrollRef = React.useRef(null);
  if (!items || items.length === 0) return null;

  const scrollLeft = () => scrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' });

  return (
    <div className="home-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2 className="section-title" style={{ margin: 0 }}>{title}</h2>
        <div className="carousel-nav">
          <button className="nav-btn" onClick={scrollLeft} title="Scroll Left"><ChevronLeft size={24} /></button>
          <button className="nav-btn" onClick={scrollRight} title="Scroll Right"><ChevronRight size={24} /></button>
        </div>
      </div>
      <div className="horizontal-scroll" ref={scrollRef}>
        {items.map((song) => (
          <div 
            key={song.id} 
            className="song-card glass-panel-interactive hover-scale"
            style={{ minWidth: '160px', width: '160px' }}
            onClick={() => {
              playSong(song, true, title);
              setIsFullScreen(true);
            }}
          >
            <div className="song-card-image">
              <img 
                src={song.thumbnailUrl} 
                alt={song.title} 
                loading="lazy" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://i.ytimg.com/vi/${song.id}/hqdefault.jpg`;
                }}
              />
              <div className="play-overlay">
                <div className="play-btn-small">
                  <Play size={20} style={{ marginLeft: '2px' }} />
                </div>
              </div>
            </div>
            <div className="song-card-info" style={{ width: '100%', overflow: 'hidden' }}>
              <ScrollingText text={song.title} textClass="song-card-title" hoverOnly={true} />
              <ScrollingText text={song.artist} textClass="text-muted text-truncate" hoverOnly={true} style={{ fontSize: '0.85rem' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const HomeFeed = () => {
  const { playSong, setIsFullScreen } = usePlayer();
  const [greeting, setGreeting] = useState('Good evening');
  const [recentSongs, setRecentSongs] = useState([]);
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Dynamic greeting based on time of day
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Good morning');
    else if (hour >= 12 && hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Load recent songs from local storage
    try {
      const recent = localStorage.getItem('tuneify_recent');
      if (recent) {
        setRecentSongs(JSON.parse(recent));
      }
    } catch(e) { console.error(e); }

    // Fetch trending songs
    const fetchTrending = async () => {
      try {
        const response = await fetch('https://tuneifymusic2-fy4dlefd.b4a.run/api/trending');
        if (response.ok) {
          const data = await response.json();
          setTrendingSongs(data);
        }
      } catch (error) {
        console.error('Failed to fetch trending', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTrending();
  }, []);

  return (
    <div className="home-feed">
      <h1 className="greeting">{greeting}</h1>
      
      {isLoading ? (
        <div className="loading-state">Curating the perfect vibes for you...</div>
      ) : (
        <div className="home-content">
          <HorizontalList title="Recently played" items={recentSongs} playSong={playSong} setIsFullScreen={setIsFullScreen} />
          <HorizontalList title="Trending Hits 🔥" items={trendingSongs} playSong={playSong} setIsFullScreen={setIsFullScreen} />
          
          {recentSongs.length === 0 && trendingSongs.length === 0 && (
            <div className="getting-started glass-panel">
              <h2>Welcome to Tuneify Music</h2>
              <p className="text-muted">Start searching for your favorite songs and artists to build your personalized universe of music.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomeFeed;
