import React, { useState, useEffect } from 'react';
import { Heart, Plus, Download, ArrowLeft, Play, Music, Camera, MoreVertical } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import './LibraryView.css';

const LibraryView = ({ setCurrentView }) => {
  const { likedSongs, downloads, playSong, setIsFullScreen, showToast, playlists, createPlaylist, deletePlaylist, editPlaylist, toggleLike, removeDownload, removeSongFromPlaylist, formatTime } = usePlayer();
  const [activeFilter, setActiveFilter] = useState('All');
  const [likedSongsView, setLikedSongsView] = useState(false);
  const [downloadsView, setDownloadsView] = useState(false);
  const [createPlaylistModal, setCreatePlaylistModal] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistImage, setPlaylistImage] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [editingPlaylistId, setEditingPlaylistId] = useState(null);
  const [activeSongDropdown, setActiveSongDropdown] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      if (activeDropdown !== null) setActiveDropdown(null);
      if (activeSongDropdown !== null) setActiveSongDropdown(null);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [activeDropdown, activeSongDropdown]);

  const handleCreatePlaylist = () => {
    setEditingPlaylistId(null);
    setCreatePlaylistModal(true);
    setPlaylistName('');
    setPlaylistImage(null);
  };

  const handleEditPlaylist = (pl) => {
    setEditingPlaylistId(pl.id);
    setCreatePlaylistModal(true);
    setPlaylistName(pl.title);
    setPlaylistImage(pl.image);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPlaylistImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const confirmPlaylistModal = () => {
    if (!playlistName.trim()) {
      showToast('Please enter a playlist name', 'info');
      return;
    }
    if (editingPlaylistId) {
      editPlaylist(editingPlaylistId, playlistName, playlistImage);
    } else {
      createPlaylist(playlistName, playlistImage);
    }
    setCreatePlaylistModal(false);
  };

  const filters = ['All', 'Playlists', 'Liked', 'Downloads'];

  const handleSongClick = (song, source = 'Library') => {
    playSong(song, true, source);
    setIsFullScreen(true);
  };

  const renderSongRow = (song, source, playlistId = null) => (
    <div
      key={song.id}
      className="library-list-item glass-panel-interactive"
      onClick={() => handleSongClick(song, source)}
      style={{ position: 'relative' }}
    >
      <div className="library-img-container">
        <img
          src={song.thumbnailUrl}
          alt={song.title}
          className="library-img"
          onError={(e) => { e.target.onerror = null; e.target.src = `https://i.ytimg.com/vi/${song.id}/hqdefault.jpg`; }}
        />
        <div className="lib-play-overlay"><Play size={16} fill="white" /></div>
      </div>
      <div className="library-info">
        <h4 className="text-truncate">{song.title}</h4>
        <p className="text-muted text-truncate">Song • {song.artist}</p>
      </div>
      {song.duration ? <div className="text-muted" style={{ fontSize: '0.85rem', paddingRight: '8px' }}>{formatTime(song.duration)}</div> : null}
      <button 
        className="icon-btn text-muted" 
        onClick={(e) => { e.stopPropagation(); setActiveSongDropdown(activeSongDropdown === song.id ? null : song.id); }}
        style={{ padding: '8px' }}
      >
        <MoreVertical size={20} />
      </button>
      {activeSongDropdown === song.id && (
        <div className="playlist-dropdown glass-panel" style={{ position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, padding: '8px', borderRadius: '12px', minWidth: '150px' }}>
          <button 
            style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', borderRadius: '8px', fontFamily: 'inherit', fontSize: '0.95rem' }} 
            className="hover-scale"
            onClick={(e) => { 
              e.stopPropagation(); 
              setActiveSongDropdown(null);
              if (source === 'Liked Songs') toggleLike(song);
              else if (source === 'Downloads') removeDownload(song.id);
              else if (playlistId) removeSongFromPlaylist(playlistId, song.id);
            }}
          >
            {source === 'Liked Songs' ? 'Remove from Liked' : (source === 'Downloads' ? 'Remove from Downloads' : 'Remove from Playlist')}
          </button>
        </div>
      )}
    </div>
  );

  /* ── Liked Songs Detail View ── */
  if (likedSongsView) {
    return (
      <div className="library-view" onClick={() => { setActiveDropdown(null); setActiveSongDropdown(null); }}>
        <div className="library-header sticky">
          <button className="lib-back-btn" onClick={() => setLikedSongsView(false)}>
            <ArrowLeft size={22} />
            <span>Your Library</span>
          </button>
          <div className="liked-detail-header">
            <div className="liked-detail-cover">
              <Heart size={40} fill="white" />
            </div>
            <div>
              <p className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Playlist</p>
              <h1 style={{ fontSize: '2rem' }}>Liked Songs</h1>
              <p className="text-muted">{likedSongs.length} {likedSongs.length === 1 ? 'song' : 'songs'}</p>
            </div>
          </div>
        </div>
        <div className="library-content">
          {likedSongs.length === 0 ? (
            <div className="lib-empty-state">
              <Heart size={48} style={{ opacity: 0.3 }} />
              <p>No liked songs yet.</p>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>Tap the ♥ on any song to save it here.</p>
            </div>
          ) : (
            likedSongs.map(song => renderSongRow(song, 'Liked Songs'))
          )}
        </div>
      </div>
    );
  }

  /* ── Downloads Detail View ── */
  if (downloadsView) {
    return (
      <div className="library-view" onClick={() => { setActiveDropdown(null); setActiveSongDropdown(null); }}>
        <div className="library-header sticky">
          <button className="lib-back-btn" onClick={() => setDownloadsView(false)}>
            <ArrowLeft size={22} />
            <span>Your Library</span>
          </button>
          <div className="liked-detail-header">
            <div className="downloads-detail-cover">
              <Download size={40} />
            </div>
            <div>
              <p className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Downloads</p>
              <h1 style={{ fontSize: '2rem' }}>Downloads</h1>
              <p className="text-muted">{downloads.length} {downloads.length === 1 ? 'song' : 'songs'}</p>
            </div>
          </div>
        </div>
        <div className="library-content">
          {downloads.length === 0 ? (
            <div className="lib-empty-state">
              <Download size={48} style={{ opacity: 0.3 }} />
              <p>No downloads yet.</p>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                Tap <strong>⋮</strong> on any song while playing, then tap <strong>Download</strong>.
              </p>
            </div>
          ) : (
            downloads.map(song => renderSongRow(song, 'Downloads'))
          )}
        </div>
      </div>
    );
  }

  /* ── Custom Playlist Detail View ── */
  if (selectedPlaylist) {
    const currentPl = playlists.find(p => p.id === selectedPlaylist.id) || selectedPlaylist;
    return (
      <div className="library-view" onClick={() => { setActiveDropdown(null); setActiveSongDropdown(null); }}>
        <div className="library-header sticky">
          <button className="lib-back-btn" onClick={() => setSelectedPlaylist(null)}>
            <ArrowLeft size={22} />
            <span>Your Library</span>
          </button>
          <div className="liked-detail-header">
            <div className={`liked-detail-cover ${currentPl.rounded ? 'rounded-full' : ''}`} style={{ padding: 0, overflow: 'hidden', background: 'transparent' }}>
              <img src={currentPl.image} alt={currentPl.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <p className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>{currentPl.type}</p>
              <h1 style={{ fontSize: '2rem' }}>{currentPl.title}</h1>
              <p className="text-muted">{currentPl.owner} • {currentPl.songs?.length || 0} {(currentPl.songs?.length === 1) ? 'song' : 'songs'}</p>
            </div>
          </div>
        </div>
        <div className="library-content">
          {(!currentPl.songs || currentPl.songs.length === 0) ? (
            <div className="lib-empty-state">
              <Music size={48} style={{ opacity: 0.3 }} />
              <p>Your playlist is empty.</p>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>Search for songs and add them here!</p>
            </div>
          ) : (
            currentPl.songs.map(song => renderSongRow(song, currentPl.title, currentPl.id))
          )}
        </div>
      </div>
    );
  }

  /* ── Main Library View ── */
  return (
    <div className="library-view" onClick={() => { setActiveDropdown(null); setActiveSongDropdown(null); }}>
      <div className="library-header sticky">
        <h1>Your Library</h1>
        <div className="library-filters">
          {filters.map(filter => (
            <button
              key={filter}
              className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="library-content">

        {/* ── Liked Songs Card ── */}
        {(activeFilter === 'All' || activeFilter === 'Liked') && (
          <div
            className="library-list-item library-card-item glass-panel-interactive"
            onClick={() => setLikedSongsView(true)}
          >
            <div className="library-img-container liked-songs-bg">
              <Heart size={28} fill="white" />
            </div>
            <div className="library-info">
              <h4 className="text-truncate">Liked Songs</h4>
              <p className="text-muted text-truncate">
                Playlist • {likedSongs.length} {likedSongs.length === 1 ? 'song' : 'songs'}
              </p>
            </div>
            <div className="lib-card-arrow">›</div>
          </div>
        )}

        {/* ── Downloads Card ── */}
        {(activeFilter === 'All' || activeFilter === 'Downloads') && (
          <div
            className="library-list-item library-card-item glass-panel-interactive"
            onClick={() => setDownloadsView(true)}
          >
            <div className="library-img-container downloads-bg">
              <Download size={28} />
            </div>
            <div className="library-info">
              <h4 className="text-truncate">Downloads</h4>
              <p className="text-muted text-truncate">
                {downloads.length === 0
                  ? 'Tap ⋮ on a song to download'
                  : `${downloads.length} ${downloads.length === 1 ? 'song' : 'songs'} downloaded`
                }
              </p>
            </div>
            <div className="lib-card-arrow">›</div>
          </div>
        )}

        {/* ── Add Playlist ── */}
        {(activeFilter === 'All' || activeFilter === 'Playlists') && (
          <div className="library-list-item glass-panel-interactive" onClick={handleCreatePlaylist}>
            <div className="library-img-container add-playlist-bg">
              <Plus size={32} className="text-muted" />
            </div>
            <div className="library-info">
              <h4 className="text-truncate">Add new playlist</h4>
              <p className="text-muted">Create a playlist</p>
            </div>
          </div>
        )}

        {/* ── Playlists ── */}
        {(activeFilter === 'All' || activeFilter === 'Playlists') && playlists.map(pl => (
          <div
            key={pl.id}
            className="library-list-item glass-panel-interactive"
            onClick={() => {
              if (activeDropdown !== pl.id) {
                setSelectedPlaylist(pl);
              }
            }}
            style={{ position: 'relative' }}
          >
            <div className={`library-img-container ${pl.rounded ? 'rounded-full' : ''}`}>
              <img src={pl.image} alt={pl.title} className="library-img" />
            </div>
            <div className="library-info">
              <h4 className="text-truncate">{pl.title}</h4>
              <p className="text-muted text-truncate">{pl.type} • {pl.owner}</p>
            </div>
            <button 
              className="icon-btn text-muted" 
              onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === pl.id ? null : pl.id); }}
            >
              <MoreVertical size={20} />
            </button>
            {activeDropdown === pl.id && (
              <div className="playlist-dropdown glass-panel" style={{ position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, padding: '8px', borderRadius: '12px', minWidth: '150px' }}>
                <button 
                  style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', borderRadius: '8px', marginBottom: '4px', fontFamily: 'inherit', fontSize: '0.95rem' }} 
                  className="hover-scale"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setActiveDropdown(null); 
                    if (setCurrentView) setCurrentView('search');
                    showToast('Search for a song, then add it from the player', 'info');
                  }}
                >
                  Add Song
                </button>
                <button 
                  style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', borderRadius: '8px', marginBottom: '4px', fontFamily: 'inherit', fontSize: '0.95rem' }} 
                  className="hover-scale"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setActiveDropdown(null); 
                    handleEditPlaylist(pl);
                  }}
                >
                  Edit Playlist
                </button>
                <button 
                  style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', borderRadius: '8px', fontFamily: 'inherit', fontSize: '0.95rem' }} 
                  className="hover-scale"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setActiveDropdown(null); 
                    deletePlaylist(pl.id); 
                  }}
                >
                  Delete Playlist
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Create Playlist Modal ── */}
      {createPlaylistModal && (
        <div className="modal-overlay" onClick={() => setCreatePlaylistModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <Music size={24} style={{ color: 'var(--primary)' }} />
              <h3>{editingPlaylistId ? 'Edit Playlist' : 'New Playlist'}</h3>
            </div>
            
            <div className="playlist-image-upload" style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
              <label htmlFor="playlist-image-input" style={{ cursor: 'pointer', position: 'relative', display: 'block' }}>
                {playlistImage ? (
                  <img src={playlistImage} alt="Cover Preview" style={{ width: '120px', height: '120px', borderRadius: '12px', objectFit: 'cover', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} />
                ) : (
                  <div style={{ width: '120px', height: '120px', borderRadius: '12px', backgroundColor: 'var(--library-img-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--add-playlist-border)', transition: 'all 0.2s ease' }} className="hover-scale">
                    <Camera size={32} className="text-muted" />
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', background: 'var(--primary)', padding: '8px', borderRadius: '50%', display: 'flex', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                   <Plus size={16} color="black" style={{ strokeWidth: 3 }} />
                </div>
              </label>
              <input 
                id="playlist-image-input" 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handleImageUpload} 
              />
            </div>

            <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
              Give your playlist a name
            </p>
            <input
              className="modal-input"
              type="text"
              placeholder="My Playlist"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmPlaylistModal()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="modal-btn modal-btn-cancel" onClick={() => setCreatePlaylistModal(false)}>Cancel</button>
              <button className="modal-btn modal-btn-confirm" onClick={confirmPlaylistModal}>{editingPlaylistId ? 'Save' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryView;
