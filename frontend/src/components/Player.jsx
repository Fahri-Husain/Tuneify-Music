import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Repeat,
  Heart, MoreVertical, ChevronDown, Download, Loader, Loader2, Check, Plus,
  ListPlus, Mic2, PlayCircle, Share
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import './Player.css';

import ScrollingText from './ScrollingText';

const Player = () => {
  const {
    currentSong, isPlaying, isBuffering, playbackSource, togglePlay, playNext, playPrevious,
    progress, duration, seek, volume, handleVolumeChange,
    isFullScreen, setIsFullScreen, toggleLike, isLiked,
    downloadSong, isDownloading, downloads,
    playlists, addSongToPlaylist, showToast,
    isShuffle, setIsShuffle, repeatMode, setRepeatMode
  } = usePlayer();
  const [showMenu, setShowMenu] = useState(false);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [viewMode, setViewMode] = useState('song');
  const [lyricsData, setLyricsData] = useState(null);
  const [loadingLyrics, setLoadingLyrics] = useState(false);

  useEffect(() => {
    if (viewMode === 'lyrics' && currentSong) {
      setLoadingLyrics(true);
      fetch(`https://tuneifymusic2-fy4dlefd.b4a.run/api/lyrics?id=${currentSong.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.lyrics) setLyricsData(data.lyrics);
          else setLyricsData('Lyrics unavailable');
        })
        .catch(() => setLyricsData('Lyrics unavailable (You might be offline)'))
        .finally(() => setLoadingLyrics(false));
    }
  }, [currentSong, viewMode]);

  if (!currentSong) return null;

  const isSongDownloaded = downloads && downloads.some(d => d.id === currentSong?.id);

  const progressPercent = (progress / duration) * 100 || 0;
  const songIsLiked = isLiked(currentSong.id);

  // Dynamic seek/volume bar fill styles
  const seekBarStyle = {
    background: `linear-gradient(to right, var(--text-main) 0%, var(--text-main) ${progressPercent}%, var(--glass-border) ${progressPercent}%, var(--glass-border) 100%)`
  };
  const volumePct = ((volume ?? 1) * 100).toFixed(1);
  const volBarStyle = {
    background: `linear-gradient(to right, var(--text-muted) 0%, var(--text-muted) ${volumePct}%, var(--glass-border) ${volumePct}%, var(--glass-border) 100%)`
  };
  const fsSeekStyle = {
    background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${progressPercent}%, var(--glass-border) ${progressPercent}%, var(--glass-border) 100%)`
  };

  const getHdThumbnail = (url, videoId) => {
    if (!url) return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    if (url.includes('googleusercontent.com') && url.includes('=w')) {
      return url.replace(/=w\d+-h\d+/, '=w1080-h1080');
    }
    // Force maxresdefault for standard youtube thumbnails to eliminate 4:3 black bars
    if (url.includes('i.ytimg.com')) {
      return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return url;
  };

  const hdCoverUrl = getHdThumbnail(currentSong.thumbnailUrl, currentSong.id);

  const handleDownloadClick = async () => {
    await downloadSong(currentSong);
    if (!isDownloading) setShowMenu(false);
  };

  return (
    <>
      {/* Mini Player */}
      {!isFullScreen && (
        <div className="mini-player">
          {/* Mobile-only thin progress bar at top */}
          <div className="mini-progress-bar mobile-progress" style={{ width: `${progressPercent}%` }} />

          <div className="mini-player-content">

            {/* ── LEFT: Cover + Song Info + Like ── */}
            <div className="mini-left">
              <img
                className="mini-cover"
                src={currentSong.thumbnailUrl}
                alt={currentSong.title}
                onClick={() => setIsFullScreen(true)}
                onError={(e) => { 
                  if (e.target.src.includes('maxresdefault.jpg')) {
                    e.target.src = `https://i.ytimg.com/vi/${currentSong.id}/hqdefault.jpg`;
                  } else {
                    e.target.onerror = null; 
                    e.target.src = `https://i.ytimg.com/vi/${currentSong.id}/mqdefault.jpg`; 
                  }
                }}
              />
              <div className="mini-text" onClick={() => setIsFullScreen(true)}>
                <ScrollingText text={currentSong.title} textClass="mini-title-text" hoverOnly={true} />
                <ScrollingText text={currentSong.artist} textClass="text-muted text-truncate mini-artist" hoverOnly={true} />
              </div>
            </div>

            {/* ── CENTER: Controls + Seek bar (desktop) ── */}
            <div className="mini-center">
              <div className="mini-center-btns">
                <button className={`mini-icon-btn ${isShuffle ? 'active-ctrl' : ''}`} onClick={() => setIsShuffle(!isShuffle)} title="Shuffle" style={{ position: 'relative' }}>
                  <Shuffle size={16} />
                  {isShuffle && <span className="ctrl-dot" />}
                </button>
                <button className="mini-icon-btn" onClick={playPrevious} title="Previous">
                  <SkipBack size={20} fill="currentColor" />
                </button>
                <button className="mini-play-btn" onClick={togglePlay} style={{ background: 'var(--primary)' }}>
                  {isBuffering ? <Loader2 size={20} className="spin-elegant" color="black" />
                    : (isPlaying ? <Pause size={20} fill="black" color="black" /> : <Play size={20} fill="black" color="black" />)}
                </button>
                <button className="mini-icon-btn" onClick={playNext} title="Next">
                  <SkipForward size={20} fill="currentColor" />
                </button>
                <button className={`mini-icon-btn ${repeatMode > 0 ? 'active-ctrl' : ''}`} onClick={() => setRepeatMode((repeatMode + 1) % 3)} style={{ position: 'relative' }} title="Repeat">
                  <Repeat size={16} />
                  {repeatMode === 2 && <span style={{ position: 'absolute', top: '-3px', right: '-5px', fontSize: '9px', fontWeight: '800', color: 'var(--primary)' }}>1</span>}
                  {repeatMode > 0 && <span className="ctrl-dot" />}
                </button>
              </div>
              <div className="mini-seek-row">
                <span className="mini-time">{Math.floor(progress / 60)}:{String(Math.floor(progress % 60)).padStart(2, '0')}</span>
                <input type="range" className="mini-seek-bar" min="0" max={duration || 100} value={progress || 0} style={seekBarStyle} onChange={(e) => seek(Number(e.target.value))} />
                <span className="mini-time">{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}</span>
              </div>
            </div>

            {/* ── RIGHT: Like + Mic + Volume + Expand (desktop) / Like + Play (mobile) ── */}
            <div className="mini-right">
              <button className="mini-icon-btn desktop-only" onClick={() => toggleLike(currentSong)} title="Like">
                <Heart size={18} fill={songIsLiked ? 'var(--primary)' : 'transparent'} color={songIsLiked ? 'var(--primary)' : 'var(--icon-color)'} />
              </button>
              <button
                className={`mini-icon-btn desktop-only ${viewMode === 'lyrics' ? 'active-ctrl' : ''}`}
                onClick={() => { setViewMode(v => v === 'lyrics' ? 'song' : 'lyrics'); setIsFullScreen(true); }}
                title="Lyrics"
              >
                <Mic2 size={18} />
              </button>
              <div className="mini-vol desktop-only" style={{ margin: '0 8px' }}>
                <Volume2 size={20} color="var(--icon-color-strong)" />
                <input type="range" className="mini-seek-bar" min="0" max="1" step="0.02" value={volume ?? 1} style={volBarStyle} onChange={(e) => handleVolumeChange(Number(e.target.value))} />
              </div>
              <button className="mini-icon-btn desktop-only" onClick={() => setIsFullScreen(true)} title="Open full player">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                  <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
              </button>
              {/* Mobile-only controls */}
              <button className="mini-icon-btn mobile-only" onClick={() => toggleLike(currentSong)}>
                <Heart size={22} fill={songIsLiked ? 'var(--primary)' : 'transparent'} color={songIsLiked ? 'var(--primary)' : 'var(--icon-color)'} />
              </button>
              <button className="mini-icon-btn mobile-only" onClick={togglePlay}>
                {isBuffering ? <Loader2 size={24} className="spin-elegant" color="var(--icon-color-strong)" />
                  : (isPlaying ? <Pause size={24} fill="var(--icon-color-strong)" color="var(--icon-color-strong)" /> : <Play size={24} fill="var(--icon-color-strong)" color="var(--icon-color-strong)" />)}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Full Screen Player */}
      {isFullScreen && (
        <div className="full-screen-player">
          <div className="fs-bg-blur" style={{ backgroundImage: `url(${hdCoverUrl})` }} />
          <div className="fs-bg-overlay" />

          <div className="fs-content">
            <div className="fs-header">
              <button className="icon-btn" onClick={() => { setIsFullScreen(false); setViewMode('song'); }}>
                <ChevronDown size={32} />
              </button>
              <div className="fs-header-text">
                <p className="text-muted" style={{ fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase' }}>Playing from selection</p>
                <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>"{playbackSource}"</p>
              </div>
              <button className="icon-btn" onClick={() => setShowMenu(true)}>
                <MoreVertical size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', margin: '16px auto', background: 'var(--tab-selector-bg)', padding: '4px', borderRadius: '24px', width: 'fit-content' }}>
              <button 
                onClick={() => setViewMode('song')}
                style={{ background: viewMode === 'song' ? 'var(--tab-active-bg)' : 'transparent', color: viewMode === 'song' ? 'var(--tab-active-color)' : 'var(--tab-inactive-color)', border: 'none', padding: '6px 20px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s', cursor: 'pointer' }}
              >
                Song
              </button>
              <button 
                onClick={() => setViewMode('lyrics')}
                style={{ background: viewMode === 'lyrics' ? 'var(--tab-active-bg)' : 'transparent', color: viewMode === 'lyrics' ? 'var(--tab-active-color)' : 'var(--tab-inactive-color)', border: 'none', padding: '6px 20px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s', cursor: 'pointer' }}
              >
                Lyrics
              </button>
            </div>

            {viewMode === 'song' ? (
              <div className="fs-cover-container">
                <img
                  src={hdCoverUrl}
                  alt={currentSong.title}
                  className="fs-cover"
                  onError={(e) => { 
                    if (e.target.src.includes('maxresdefault.jpg')) {
                      e.target.src = `https://i.ytimg.com/vi/${currentSong.id}/hqdefault.jpg`;
                    } else {
                      e.target.onerror = null; 
                      e.target.src = `https://i.ytimg.com/vi/${currentSong.id}/mqdefault.jpg`; 
                    }
                  }}
                />
              </div>
            ) : (
              <div className="fs-lyrics-container" style={{ width: '100%', flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 10px', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                {loadingLyrics ? (
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Loader2 size={32} className="spin-elegant" color="var(--text-muted)" />
                  </div>
                ) : (
                  <div style={{ fontSize: '1.2rem', lineHeight: '2.2', color: 'var(--text-main)', fontWeight: 'bold' }}>
                    {Array.isArray(lyricsData) ? lyricsData.map((line, i) => (
                      <p key={i} style={{ margin: 0, color: line ? 'var(--text-main)' : 'transparent', userSelect: 'none' }}>{line || '...'}</p>
                    )) : (
                      <p style={{ marginTop: '40%' }}>{lyricsData}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="fs-info-section">
              <div className="fs-text" style={{ flex: 1, overflow: 'hidden' }}>
                <ScrollingText text={currentSong.title} textClass="fs-title-text" />
                <p className="text-muted text-truncate" style={{ marginTop: '4px' }}>Song, {currentSong.artist}</p>
              </div>
              <button className="icon-btn" onClick={() => toggleLike(currentSong)}>
                <Heart size={28} fill={songIsLiked ? 'var(--text-main)' : 'transparent'} color={songIsLiked ? 'var(--text-main)' : 'var(--icon-color)'} />
              </button>
            </div>

            <div className="fs-progress-section">
              <input
                type="range"
                className="progress-bar full-width"
                min="0"
                max={duration || 100}
                value={progress || 0}
                style={fsSeekStyle}
                onChange={(e) => seek(Number(e.target.value))}
              />
              <div className="fs-time">
                <span>{Math.floor(progress / 60)}:{(Math.floor(progress % 60)).toString().padStart(2, '0')}</span>
                <span>{Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}</span>
              </div>
            </div>

            <div className="fs-main-controls">
              <button 
                className="icon-btn" 
                onClick={() => setIsShuffle(!isShuffle)}
                style={{ color: isShuffle ? 'var(--primary)' : 'var(--text-muted)', position: 'relative' }}
              >
                <Shuffle size={24} color={isShuffle ? 'var(--primary)' : 'currentColor'} />
                {isShuffle && <span style={{ position: 'absolute', bottom: '0px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></span>}
              </button>
              <button className="icon-btn" onClick={playPrevious}><SkipBack size={36} fill="var(--icon-color-strong)" color="var(--icon-color-strong)" /></button>
              <button className="play-pause-huge" onClick={togglePlay}>
                {isBuffering ? <Loader2 size={40} className="spin-elegant" color="black" /> : 
                  (isPlaying ? <Pause size={40} fill="black" color="black" /> : <Play size={40} fill="black" color="black" />)}
              </button>
              <button className="icon-btn" onClick={playNext}><SkipForward size={36} fill="var(--icon-color-strong)" color="var(--icon-color-strong)" /></button>
              <button 
                className="icon-btn" 
                onClick={() => setRepeatMode((repeatMode + 1) % 3)}
                style={{ color: repeatMode > 0 ? 'var(--primary)' : 'var(--text-muted)', position: 'relative' }}
              >
                <Repeat size={24} color={repeatMode > 0 ? 'var(--primary)' : 'currentColor'} />
                {repeatMode > 0 && <span style={{ position: 'absolute', bottom: '0px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></span>}
                {repeatMode === 2 && (
                  <span style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', fontWeight: 'bold', color: 'var(--bg-card)' }}>1</span>
                )}
              </button>
            </div>


          </div>

          {/* Bottom Sheet Menu */}
          {showMenu && (
            <div className="bottom-sheet-overlay" onClick={() => {
              if (showPlaylistSelector) setShowPlaylistSelector(false);
              else if (!isDownloading) setShowMenu(false);
            }}>
              <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
                {/* Drag handle */}
                <div className="sheet-drag-handle" />

                {showPlaylistSelector ? (
                  <>
                    <div className="sheet-header" style={{ borderBottom: '1px solid var(--sheet-border)', paddingBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                        <button className="icon-btn" onClick={() => setShowPlaylistSelector(false)}>
                          <ChevronDown size={24} style={{ transform: 'rotate(90deg)' }} />
                        </button>
                        <h3 style={{ margin: 0, flex: 1, fontSize: '1.2rem' }}>Add to Playlist</h3>
                      </div>
                    </div>
                    <div className="sheet-options" style={{ maxHeight: '50vh', overflowY: 'auto', padding: '8px 0' }}>
                      {playlists.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                          <p>You haven't created any playlists yet.</p>
                          <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Go to your Library to create one.</p>
                        </div>
                      ) : (
                        playlists.map(pl => (
                          <div 
                            key={pl.id} 
                            className="sheet-btn glass-panel-interactive" 
                            style={{ padding: '12px', gap: '16px', borderRadius: '12px', marginBottom: '8px', border: '1px solid transparent' }}
                            onClick={() => {
                              addSongToPlaylist(pl.id, currentSong);
                              setShowPlaylistSelector(false);
                              setShowMenu(false);
                            }}
                          >
                            <img src={pl.image} alt={pl.title} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                            <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                              <h4 className="text-truncate" style={{ margin: 0, fontSize: '1rem' }}>{pl.title}</h4>
                              <p className="text-muted text-truncate" style={{ margin: 0, fontSize: '0.8rem' }}>{pl.songs?.length || 0} songs</p>
                            </div>
                            <Plus size={20} color="var(--primary)" />
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="sheet-header">
                  <img
                    src={hdCoverUrl}
                    alt={currentSong.title}
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://i.ytimg.com/vi/${currentSong.id}/hqdefault.jpg`; }}
                  />
                  <div className="sheet-header-info">
                    <h4>{currentSong.title}</h4>
                    <p className="text-muted">Song, {currentSong.artist}</p>
                  </div>
                </div>

                <div className="sheet-options">
                  {/* Download Option */}
                  <button
                    className={`sheet-btn sheet-btn-download ${isDownloading ? 'downloading' : ''}`}
                    onClick={handleDownloadClick}
                    disabled={isDownloading || isSongDownloaded}
                  >
                    <span className="sheet-btn-icon">
                      {isSongDownloaded 
                        ? <Check size={20} color="var(--primary)" />
                        : (isDownloading ? <Loader size={20} className="spin-icon" /> : <Download size={20} />)
                      }
                    </span>
                    <span>{isSongDownloaded ? 'Downloaded' : (isDownloading ? 'Downloading...' : 'Download')}</span>
                    {isDownloading && !isSongDownloaded && (
                      <span className="download-dest-hint">Saving to Library → Downloads</span>
                    )}
                  </button>

                  <button className="sheet-btn" onClick={() => setShowPlaylistSelector(true)}>
                    <span className="sheet-btn-icon"><ListPlus size={20} color="var(--text-main)" /></span>
                    <span>Add to playlist</span>
                  </button>
                  <button className="sheet-btn" onClick={() => setShowMenu(false)}>
                    <span className="sheet-btn-icon"><Mic2 size={20} color="var(--text-main)" /></span>
                    <span>View Artist ({currentSong.artist})</span>
                  </button>
                  <button
                    className="sheet-btn"
                    onClick={() => { window.open(`https://www.youtube.com/watch?v=${currentSong.id}`, '_blank'); setShowMenu(false); }}
                  >
                    <span className="sheet-btn-icon"><PlayCircle size={20} color="var(--text-main)" /></span>
                    <span>Open in YouTube</span>
                  </button>
                  <button className="sheet-btn" onClick={async () => {
                    const url = `https://www.youtube.com/watch?v=${currentSong.id}`;
                    if (navigator.share) {
                      try { await navigator.share({ title: currentSong.title, url }); } catch(e) {}
                    } else {
                      navigator.clipboard.writeText(url);
                      showToast('Link copied to clipboard', 'success');
                    }
                    setShowMenu(false);
                  }}>
                    <span className="sheet-btn-icon"><Share size={20} color="var(--text-main)" /></span>
                    <span>Share this song</span>
                  </button>
                </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Player;
