async function test() {
  const m = await import('ytmusic-api');
  const YTMusic = m.default;
  const ytmusic = new YTMusic();
  await ytmusic.initialize();
  
  const songs = await ytmusic.searchSongs("dewa 19");
  console.log("Songs dew19 artist:", JSON.stringify(songs.slice(0, 2).map(s => s.artist), null, 2));

  const songs2 = await ytmusic.searchSongs("linkin park");
  console.log("Songs linkin park artist:", JSON.stringify(songs2.slice(0, 2).map(s => s.artist), null, 2));
}

test().catch(console.error);
