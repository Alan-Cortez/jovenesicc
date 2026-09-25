async function test() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/thiagobodruk/bible/master/json/es_rvr.json');
    const data = await res.json();
    console.log("Length:", data.length);
    if(data.length > 0) {
      console.log("First element:", data[0]);
    }
  } catch (e) {
    console.error("github fetch failed:", e.message);
  }
}
test();
