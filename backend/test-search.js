async function test() {
  const m = await import('ytmusic-api');
  const YTMusic = m.default;
  const ytmusic = new YTMusic();
  await ytmusic.initialize();
  const songs = await ytmusic.searchSongs("alan walker");
  console.log("Songs:", JSON.stringify(songs.slice(0, 1), null, 2));
}

test().catch(console.error);
