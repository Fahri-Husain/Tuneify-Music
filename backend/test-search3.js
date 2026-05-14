async function test() {
  const m = await import('ytmusic-api');
  const YTMusic = m.default;
  const ytmusic = new YTMusic();
  await ytmusic.initialize();
  
  const results = await ytmusic.search("lagu galau indonesia");
  console.log("General search:", JSON.stringify(results.slice(0, 5), null, 2));
}

test().catch(console.error);
