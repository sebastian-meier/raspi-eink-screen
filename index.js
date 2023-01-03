const gd = require('node-gd');
require('dotenv').config();

// const compWeather = require('./components/weather/index.js');
// const w = new compWeather();

// const compCalendar = require('./components/ical/index');
// const cal = new compCalendar();

const compMail = require('./components/mail/index');
const mail = new compMail();

gd.create(640, 384).then((img) => {
  // background
  // img.colorAllocate(255, 255, 255);
  // w.setup().then(() => {
  //   w.draw(img, 0, 0);
  //   return img.savePng('output.png', 1);
  // }).then(() => {
  //   img.destroy();
  //   console.log('DONE');
  // });
  // cal.setup()
  //   .then(() => cal.draw());
  mail.setup();
});
