const express = require('express');
const cors = require('cors');
const YTMusic = require('ytmusic-api').default;
const ytdl = require('@distube/ytdl-core');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize YTMusic API via dynamic import
let ytmusic;
import('ytmusic-api').then(m => {
  const YTMusic = m.default;
  ytmusic = new YTMusic();
  ytmusic.initialize().then(() => {
    console.log('YTMusic API Initialized');
  }).catch(err => {
    console.error('Failed to initialize YTMusic', err);
  });
}).catch(err => {
  console.error('Failed to load ytmusic-api module', err);
});

// Endpoint: Search Songs
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Query parameter "q" is required' });

  try {
    // Jalankan pencarian paralel untuk mempercepat respon
    const [songs, videos, albums, artists] = await Promise.all([
      ytmusic.searchSongs(query).catch(() => []),
      ytmusic.searchVideos(query).catch(() => []),
      ytmusic.searchAlbums(query).catch(() => []),
      ytmusic.searchArtists(query).catch(() => [])
    ]);

    // Format fungsi helper
    const formatItem = (item, type) => {
      let thumb = item.videoId ? `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg` : '';
      if (item.thumbnails && item.thumbnails.length > 0) {
        thumb = item.thumbnails[item.thumbnails.length - 1].url;
      }
      
      return {
        id: item.videoId || item.albumId || item.artistId,
        title: item.name || item.title,
        artist: item.artist ? item.artist.name : (type === 'artist' ? `${item.subscribers || ''}` : ''),
        thumbnailUrl: thumb,
        type: type,
        duration: item.duration || 0
      };
    };

    res.json({
      albums: albums.slice(0, 15).map(a => formatItem(a, 'album')),
      videos: videos.slice(0, 15).map(v => formatItem(v, 'video')),
      songs: songs.slice(0, 15).map(s => formatItem(s, 'song')),
      artists: artists.slice(0, 15).map(a => formatItem(a, 'artist'))
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search YouTube Music' });
  }
});

// Endpoint: Trending / Hype Songs
app.get('/api/trending', async (req, res) => {
  try {
    // Kita gunakan trik pencarian query populer untuk mendapatkan lagu yang hype
    const results = await ytmusic.searchSongs('Top Hits Global 2024');
    
    const formattedResults = results.slice(0, 10).map(song => {
      let thumb = `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg`;
      if (song.thumbnails && song.thumbnails.length > 0) {
        thumb = song.thumbnails[song.thumbnails.length - 1].url;
      }
      return {
        id: song.videoId,
        title: song.name,
        artist: song.artist.name,
        thumbnailUrl: thumb,
        type: 'song',
        duration: song.duration || 0
      };
    });
    res.json(formattedResults);
  } catch (error) {
    console.error('Trending error:', error);
    res.status(500).json({ error: 'Failed to fetch trending songs' });
  }
});

// Endpoint: Up Next (Related Songs)
app.get('/api/next', async (req, res) => {
  const videoId = req.query.id;
  if (!videoId) return res.status(400).json({ error: 'Video ID parameter "id" is required' });

  try {
    const nexts = await ytmusic.getUpNexts(videoId);
    // Format the results to match our frontend needs
    const formattedResults = nexts.map(song => {
      let thumb = `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg`;
      if (typeof song.thumbnail === 'string' && song.thumbnail) {
        thumb = song.thumbnail;
      } else if (song.thumbnails && song.thumbnails.length > 0) {
        thumb = song.thumbnails[song.thumbnails.length - 1].url;
      }

      return {
        id: song.videoId,
        title: song.title,
        artist: Array.isArray(song.artists) ? song.artists.map(a => a.name).join(', ') : (song.artists || 'Unknown Artist'),
        thumbnailUrl: thumb,
        duration: song.duration || song.length?.seconds || parseInt(song.length) || 0
      };
    });
    res.json(formattedResults);
  } catch (error) {
    console.error('UpNext error:', error);
    res.status(500).json({ error: 'Failed to fetch up next songs' });
  }
});

// Endpoint: Lyrics
app.get('/api/lyrics', async (req, res) => {
  const videoId = req.query.id;
  if (!videoId) return res.status(400).json({ error: 'Video ID parameter "id" is required' });

  try {
    const lyrics = await ytmusic.getLyrics(videoId);
    res.json({ lyrics });
  } catch (error) {
    console.error('Lyrics error:', error);
    res.status(500).json({ error: 'Failed to fetch lyrics' });
  }
});

// Endpoint: Proxy Audio Stream
// Kita me-routing stream audio melalui backend untuk menghindari pemblokiran IP/CORS di browser frontend
app.get('/api/stream/:videoId', async (req, res) => {
  const videoId = req.params.videoId;
  if (!videoId) return res.status(400).json({ error: 'Video ID is required' });

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  
  try {
    // Pipe the audio directly to the client response
    res.header('Content-Type', 'audio/mpeg');
    ytdl(url, { filter: 'audioonly', quality: 'highestaudio' })
      .on('error', (err) => {
        console.error('ytdl error:', err);
        if (!res.headersSent) res.status(500).end();
      })
      .pipe(res);
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({ error: 'Failed to start audio stream' });
  }
});

app.get('/api/download', async (req, res) => {
  const videoId = req.query.id;
  const title = req.query.title || 'song';
  
  if (!videoId) return res.status(400).json({ error: 'Video ID is required' });

  try {
    const filename = `${title.replace(/[/\\?%*:|"<>]/g, '')}.mp3`;
    res.header('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.header('Content-Type', 'audio/mpeg');
    ytdl(`https://www.youtube.com/watch?v=${videoId}`, { filter: 'audioonly', quality: 'highestaudio' })
      .on('error', (err) => {
        console.error('ytdl error on download:', err);
        if (!res.headersSent) res.status(500).end();
      })
      .pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download audio' });
  }
});

// Endpoint: Submit Bug/Report
app.post('/api/report', async (req, res) => {
  const { email, issue } = req.body;
  if (!email || !issue) return res.status(400).json({ error: 'Email and issue are required' });

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'tuneifymusicapp@gmail.com',
        pass: process.env.EMAIL_PASS || 'your_app_password_here'
      }
    });

    const mailOptions = {
      from: `Tuneify Report <${process.env.EMAIL_USER || 'tuneifymusicapp@gmail.com'}>`,
      to: 'fahrihusain243@gmail.com',
      subject: `[Tuneify Report] Bug/Feedback from ${email}`,
      text: `User Email: ${email}\n\nIssue/Feedback:\n${issue}`
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Report sent successfully' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send report. Please check server email credentials.' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Tuneify backend listening at http://0.0.0.0:${port}`);
});
