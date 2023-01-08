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

const bboxCalc = (img, text, size, font) => {
  const txtColor = img.colorAllocate(0, 0, 0);
  let bbox = img.stringFT(txtColor, font, size, 0, 0, 0, text, true);
  return {
    width: bbox[2] - bbox[0],
    height: bbox[3]- bbox[5]
  };
};


module.exports.httpsGet = httpsGet;
module.exports.bboxCalc = bboxCalc;