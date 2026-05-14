import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';

const PlayerContext = createContext();

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackSource, setPlaybackSource] = useState('Random Selection');
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); // 0: off, 1: repeat all, 2: repeat one
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [likedSongs, setLikedSongs] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [toast, setToast] = useState(null);

  const playerRef = useRef(null);
  const progressInterval = useRef(null);
  const toastTimer = useRef(null);
  const silentAudioRef = useRef(null);

  // Initialize Web Audio API oscillator to keep audio context completely active
  useEffect(() => {
    let audioCtx;
    let oscillator;
    let gainNode;

    const startOscillator = () => {
      if (audioCtx) return; // already started
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        oscillator = audioCtx.createOscillator();
        gainNode = audioCtx.createGain();
        
        // Make it completely inaudible but active
        gainNode.gain.value = 0.0001;
        oscillator.frequency.value = 1; // 1 Hz
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
      } catch (e) {
        console.error('AudioContext error:', e);
      }
      document.removeEventListener('click', startOscillator);
      document.removeEventListener('touchstart', startOscillator);
    };

    document.addEventListener('click', startOscillator);
    document.addEventListener('touchstart', startOscillator);
    
    return () => {
      document.removeEventListener('click', startOscillator);
      document.removeEventListener('touchstart', startOscillator);
      if (oscillator) {
        oscillator.stop();
        oscillator.disconnect();
      }
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    try {
      const liked = localStorage.getItem('tuneify_liked_songs');
      if (liked) setLikedSongs(JSON.parse(liked));
    } catch(e) {}
  }, []);

  useEffect(() => {
    try {
      const dl = localStorage.getItem('tuneify_downloads');
      if (dl) setDownloads(JSON.parse(dl));
    } catch(e) {}
  }, []);

  useEffect(() => {
    try {
      const pl = localStorage.getItem('tuneify_playlists');
      if (pl) setPlaylists(JSON.parse(pl));
    } catch(e) {}
  }, []);

  const showToast = (message, type = 'success', icon = null) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type, icon });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  const downloadSong = async (song) => {
    if (isDownloading) return;
    if (downloads.some(d => d.id === song.id)) {
      showToast('Already in Downloads', 'info');
      return false;
    }
    setIsDownloading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Simulate saving for offline use within the app's internal library
      const newDownloads = [{ ...song, downloadedAt: Date.now() }, ...downloads];
      setDownloads(newDownloads);
      localStorage.setItem('tuneify_downloads', JSON.stringify(newDownloads));
      showToast('Saved to Library → Downloads', 'download');
      return true;
    } catch(e) {
      showToast('Download failed. Try again.', 'error');
      return false;
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          setProgress(playerRef.current.getCurrentTime() || 0);
        }
      }, 1000);
    } else {
      clearInterval(progressInterval.current);
    }
    return () => clearInterval(progressInterval.current);
  }, [isPlaying]);

  const toggleLike = (song) => {
    if (!song) return;
    let newLiked = [...likedSongs];
    const isAlreadyLiked = newLiked.some(s => s.id === song.id);
    if (isAlreadyLiked) {
      newLiked = newLiked.filter(s => s.id !== song.id);
      showToast('Removed from Liked Songs', 'info', '♡');
    } else {
      newLiked.unshift(song);
      showToast('Added to Liked Songs', 'like', '♥');
    }
    setLikedSongs(newLiked);
    localStorage.setItem('tuneify_liked_songs', JSON.stringify(newLiked));
  };

  const createPlaylist = (name, image) => {
    const finalImage = image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&size=150`;
    const newPlaylist = {
      id: Date.now(),
      title: name.trim(),
      type: 'Playlist',
      owner: 'You',
      image: finalImage,
      rounded: false,
      songs: []
    };
    const newPlaylists = [newPlaylist, ...playlists];
    setPlaylists(newPlaylists);
    localStorage.setItem('tuneify_playlists', JSON.stringify(newPlaylists));
    showToast(`Playlist "${newPlaylist.title}" created`, 'success', '🎵');
  };

  const deletePlaylist = (playlistId) => {
    const newPlaylists = playlists.filter(pl => pl.id !== playlistId);
    setPlaylists(newPlaylists);
    localStorage.setItem('tuneify_playlists', JSON.stringify(newPlaylists));
    showToast('Playlist deleted', 'info');
  };

  const editPlaylist = (playlistId, newName, newImage) => {
    const newPlaylists = playlists.map(pl => {
      if (pl.id === playlistId) {
        let finalImage = pl.image;
        if (newImage) {
          finalImage = newImage;
        } else if (pl.image && pl.image.includes('ui-avatars')) {
          // Regenerate avatar if name changed
          finalImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(newName.trim())}&background=10b981&color=fff&size=150`;
        }
        return { ...pl, title: newName.trim(), image: finalImage };
      }
      return pl;
    });
    setPlaylists(newPlaylists);
    localStorage.setItem('tuneify_playlists', JSON.stringify(newPlaylists));
    showToast('Playlist updated', 'success', '🎵');
  };

  const addSongToPlaylist = (playlistId, song) => {
    const newPlaylists = playlists.map(pl => {
      if (pl.id === playlistId) {
        const currentSongs = pl.songs || [];
        const isExist = currentSongs.some(s => s.id === song.id);
        if (!isExist) {
          return { ...pl, songs: [...currentSongs, song] };
        } else {
          showToast(`Already in ${pl.title}`, 'info');
          return pl; // No change
        }
      }
      return pl;
    });
    setPlaylists(newPlaylists);
    localStorage.setItem('tuneify_playlists', JSON.stringify(newPlaylists));
    showToast(`Added to playlist`, 'success', '🎵');
  };

  const removeSongFromPlaylist = (playlistId, songId) => {
    const newPlaylists = playlists.map(pl => {
      if (pl.id === playlistId) {
        return { ...pl, songs: (pl.songs || []).filter(s => s.id !== songId) };
      }
      return pl;
    });
    setPlaylists(newPlaylists);
    localStorage.setItem('tuneify_playlists', JSON.stringify(newPlaylists));
    showToast('Song removed from playlist', 'info');
  };

  const removeDownload = (songId) => {
    const newDownloads = downloads.filter(s => s.id !== songId);
    setDownloads(newDownloads);
    localStorage.setItem('tuneify_downloads', JSON.stringify(newDownloads));
    showToast('Removed from Downloads', 'info');
  };

  const onReady = (event) => {
    playerRef.current = event.target;
    playerRef.current.setVolume(volume * 100);
    if (typeof playerRef.current.getDuration === 'function') {
      setDuration(playerRef.current.getDuration());
    }
    if (isPlaying) playerRef.current.playVideo();
  };

  const onStateChange = (event) => {
    // 1: playing, 2: paused, 3: buffering, 0: ended, -1: unstarted
    if (event.data === 1) {
      setIsPlaying(true);
      setIsBuffering(false);
      if (typeof playerRef.current.getDuration === 'function') {
        setDuration(playerRef.current.getDuration());
      }
    } else if (event.data === 2) {
      setIsPlaying(false);
      setIsBuffering(false);
    } else if (event.data === 3) {
      setIsBuffering(true);
    } else if (event.data === -1) {
      setIsBuffering(true);
      // Force play if it is unstarted but we expect it to be playing
      if (isPlaying && playerRef.current) {
        playerRef.current.playVideo();
      }
    } else if (event.data === 0) {
      setIsBuffering(false);
      playNext();
    }
  };

  const fetchUpNext = async (videoId) => {
    try {
      const response = await fetch(`https://tuneifymusic2-fy4dlefd.b4a.run/api/next?id=${videoId}`);
      if (response.ok) return await response.json();
    } catch (e) { console.error(e); }
    return [];
  };

  const playSong = async (song, startRadio = false, source = 'Random Selection') => {
    setCurrentSong(song);
    setPlaybackSource(source);

    let isLibraryPlaylist = false;
    let libraryQueue = [];

    if (source === 'Downloads') {
      isLibraryPlaylist = true;
      libraryQueue = downloads;
    } else if (source === 'Liked Songs') {
      isLibraryPlaylist = true;
      libraryQueue = likedSongs;
    } else {
      const pl = playlists.find(p => p.title === source);
      if (pl) {
        isLibraryPlaylist = true;
        libraryQueue = pl.songs || [];
      }
    }

    if (isLibraryPlaylist) {
      const songIndex = libraryQueue.findIndex(s => s.id === song.id);
      setQueue(libraryQueue);
      setCurrentIndex(songIndex !== -1 ? songIndex : 0);
    } else if (startRadio) {
      setQueue([song]);
      setCurrentIndex(0);
      fetchUpNext(song.id).then(nextSongs => {
        const filtered = nextSongs.filter(s => s.id !== song.id);
        setQueue([song, ...filtered]);
      });
    } else {
      const index = queue.findIndex(s => s.id === song.id);
      if (index !== -1) {
        setCurrentIndex(index);
      } else if (queue.length === 0) {
        setQueue([song]);
        setCurrentIndex(0);
      }
    }
    setIsPlaying(true);
    setIsBuffering(true);
    setProgress(0);
    if (playerRef.current) {
      playerRef.current.loadVideoById(song.id);
      playerRef.current.playVideo(); // Force play explicitly to override background blocks
    }
    try {
      const recentStr = localStorage.getItem('tuneify_recent');
      let recentList = recentStr ? JSON.parse(recentStr) : [];
      recentList = recentList.filter(s => s.id !== song.id);
      recentList.unshift(song);
      if (recentList.length > 20) recentList.pop();
      localStorage.setItem('tuneify_recent', JSON.stringify(recentList));
    } catch(e) { console.error(e); }
  };

  const togglePlay = () => {
    if (!currentSong || !playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  };


  const playNext = async () => {
    if (repeatMode === 2) {
      seek(0);
      if (!isPlaying) togglePlay();
      return;
    }

    let nextIndex = currentIndex + 1;
    
    if (isShuffle && queue.length > 1) {
      nextIndex = Math.floor(Math.random() * queue.length);
      if (nextIndex === currentIndex) {
        nextIndex = (nextIndex + 1) % queue.length;
      }
    }

    if (nextIndex < queue.length) {
      const nextSong = queue[nextIndex];
      let nextSource = playbackSource;

      // Smart label detection for radio streams
      if (playbackSource === 'Recently played' || playbackSource === 'Trending Hits 🔥') {
        try {
          const recentStr = localStorage.getItem('tuneify_recent');
          const isRecent = recentStr && JSON.parse(recentStr).some(s => s.id === nextSong.id);
          nextSource = isRecent ? 'Recently played' : 'Random Selection';
        } catch(e) {}
      }

      playSong(nextSong, false, nextSource);
    } else {
      if (repeatMode === 1) {
        const firstIndex = isShuffle && queue.length > 1 ? Math.floor(Math.random() * queue.length) : 0;
        playSong(queue[firstIndex], false, playbackSource);
      } else if (playbackSource === 'Downloads') {
        setIsPlaying(false);
      } else {
        // Reached the end of a playlist/liked songs, switch to Random Selection radio
        setIsBuffering(true);
        const nextSongs = await fetchUpNext(currentSong.id);
        const nextSong = nextSongs.find(s => s.id !== currentSong.id);
        if (nextSong) {
          playSong(nextSong, true, 'Random Selection');
        } else {
          setIsPlaying(false);
        }
      }
    }
  };

  const playPrevious = () => {
    if (!playerRef.current) return;
    if (typeof playerRef.current.getCurrentTime === 'function') {
      const time = playerRef.current.getCurrentTime();
      if (time > 3) { playerRef.current.seekTo(0); return; }
    }
    if (currentIndex > 0) {
      const prevSong = queue[currentIndex - 1];
      let prevSource = playbackSource;
      
      // Smart label detection for radio streams
      if (playbackSource === 'Random Selection' || playbackSource === 'Trending Hits 🔥') {
        try {
          const recentStr = localStorage.getItem('tuneify_recent');
          const isRecent = recentStr && JSON.parse(recentStr).some(s => s.id === prevSong.id);
          prevSource = isRecent ? 'Recently played' : 'Random Selection';
        } catch(e) {}
      }

      playSong(prevSong, false, prevSource);
    } else if (repeatMode === 1 && queue.length > 0) {
      playSong(queue[queue.length - 1], false, playbackSource);
    }
  };

  const seek = (time) => {
    if (playerRef.current) { playerRef.current.seekTo(time); setProgress(time); }
  };

  const handleVolumeChange = (vol) => {
    setVolume(vol);
    if (playerRef.current) playerRef.current.setVolume(vol * 100);
  };

  const formatTime = (time) => {
    if (isNaN(time) || !time) return '0:00';
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const isLiked = (songId) => likedSongs.some(s => s.id === songId);

  // Set up Media Session API for background playback support
  useEffect(() => {
    if ('mediaSession' in navigator && currentSong) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        artwork: [
          { src: currentSong.thumbnailUrl, sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        if (playerRef.current) playerRef.current.playVideo();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (playerRef.current) playerRef.current.pauseVideo();
      });
      navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
      navigator.mediaSession.setActionHandler('nexttrack', playNext);
    }
  }, [currentSong, playNext, playPrevious]);

  const opts = {
    height: '200', width: '200',
    playerVars: { autoplay: 1, controls: 0, disablekb: 1, fs: 0, playsinline: 1 },
  };

  return (
    <PlayerContext.Provider value={{
      currentSong, isPlaying, isBuffering, playbackSource, progress, duration, queue, volume, isFullScreen, setIsFullScreen,
      likedSongs, toggleLike, isLiked,
      downloads, isDownloading, downloadSong, removeDownload,
      playlists, createPlaylist, deletePlaylist, addSongToPlaylist, editPlaylist, removeSongFromPlaylist,
      toast, showToast, isShuffle, setIsShuffle, repeatMode, setRepeatMode,
      playSong, togglePlay, playNext, playPrevious, seek, formatTime, handleVolumeChange
    }}>
      {children}
      {currentSong && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, pointerEvents: 'none' }}>
          <YouTube
            videoId={currentSong.id}
            opts={opts}
            onReady={onReady}
            onStateChange={onStateChange}
            onError={(e) => console.error("YouTube Player Error:", e)}
          />
        </div>
      )}
    </PlayerContext.Provider>
  );
};
