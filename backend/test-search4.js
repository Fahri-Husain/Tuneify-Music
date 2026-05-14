async function test() {
  const m = await import('ytmusic-api');
  const YTMusic = m.default;
  const ytmusic = new YTMusic();
  await ytmusic.initialize();
  
  const songs = await ytmusic.searchSongs("lagu galau indonesia");
  console.log("Songs:", songs.length);
}

test().catch(console.error);
