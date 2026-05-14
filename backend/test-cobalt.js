async function testCobalt() {
  const videoId = "ZM8rAsTT7yE";
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  
  try {
    const response = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        isAudioOnly: true
      })
    });
    
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e);
  }
}

testCobalt();
