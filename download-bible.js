const fs = require('fs');
const path = require('path');
const https = require('https');

const destDir = path.join(__dirname, 'src', 'lib', 'data');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const destPath = path.join(destDir, 'es_rvr.json');
const file = fs.createWriteStream(destPath);

https.get('https://raw.githubusercontent.com/thiagobodruk/bible/master/json/es_rvr.json', function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close();
    console.log('Download completed');
  });
}).on('error', function(err) {
  fs.unlink(destPath);
  console.error('Error downloading:', err.message);
});
