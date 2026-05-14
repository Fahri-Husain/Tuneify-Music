const ytdl = require('@distube/ytdl-core');

async function testYtdl() {
  const videoId = "ZM8rAsTT7yE";
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  
  try {
    const info = await ytdl.getInfo(url);
    console.log("Success! Found formats:", info.formats.length);
  } catch(e) {
    console.error("Error with ytdl:", e.message);
  }
}

testYtdl();
