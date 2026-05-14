const play = require('play-dl');

async function testPlayDl() {
  const videoId = "ZM8rAsTT7yE";
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  
  try {
    const stream = await play.stream(url);
    console.log("Stream found:", stream.type);
  } catch(e) {
    console.error("Error with play-dl:", e.message);
  }
}

testPlayDl();
