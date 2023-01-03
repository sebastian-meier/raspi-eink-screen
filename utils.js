const https = require('https');

const httpsGet = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
        let data = '';
        res.on('data', (d) => {
          data += d;
        });
        res.on('end', () => {
          resolve(data);
        });
      }).on('error', (err) => {
        rejects(err);
      });
  });
};

module.exports.httpsGet = httpsGet;