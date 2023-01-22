const gd = require('node-gd');

const Gpio = require('onoff').Gpio;
const nodaryEncoder = require('nodary-encoder');
const epd7x5 = require('epd7x5');

const myEncoder = nodaryEncoder(20, 21);

myEncoder.on('rotation', (direction, value) => {
  if (direction === 'R') {
    console.log('right', value);
  } else {
    console.log('left', value);
  }
});

const rotButton = new Gpio(16, 'in', 'both');
rotButton.watch((err, value) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(value);
});

const fs = require('fs');
require('dotenv').config();

epd7x5.init();

const dWidth = 640;
const dHeight = 384;
const iWidth = dHeight;
const iHeight = dWidth;
const padding = 15;

const compWeather = require('./components/weather/index.js');
const w = new compWeather();

const compCalendar = require('./components/ical/index');
const cal = new compCalendar();

const compMail = require('./components/mail/index');
const mail = new compMail();

const hellos = [
  ['Arabic', 'Marhaba'],
  ['German', 'Hallo'],
  ['Bengali', 'Namaskar'],
  ['Bulgarian', 'Zdraveite'],
  ['Catalan', 'Hola  '],
  ['Chamorro', 'Hafa adai'],
  ['Chinese', 'Nǐ hǎo'],
  ['Croatian', 'Dobar dan'],
  ['Danish', 'God dag'],
  ['Dutch', 'Hoi'],
  ['Finnish', 'hyvää päivää'],
  ['French', 'Bonjour'],
  ['Gaeilge', 'Dia dhuit'],
  ['Greek', 'Yasou'],
  ['Hebrew', 'Shalom'],
  ['Hindi', 'Namaste'],
  ['Hungarian', 'Jo napot'],
  ['Icelandic', 'Góðan dag'],
  ['Igbo', 'Nde-ewo'],
  ['Indonesian', 'Selamat siang'],
  ['Italian', 'Ciao'],
  ['Japanese', 'Konnichiwa'],
  ['Korean', 'Ahn nyong ha se yo'],
  ['Latin', 'Salve'],
  ['Lithuanian', 'Sveiki'],
  ['Luxembourgish', 'Moïen'],
  ['Maltese', 'Bonġu'],
  ['Nahuatl', 'Niltze'],
  ['Nepali', 'Namastē'],
  ['Norwegian', 'Hallo'],
  ['Persian', 'Salam'],
  ['Polish', 'Cześć'],
  ['Portuguese', 'Olá'],
  ['Romanian', 'Bună ziua'],
  // ['Russian', 'Zdravstvuyte'],
  ['Serbian', 'Zdravo'],
  ['Slovak', 'Ahoj'],
  ['Spanish', 'Hola'],
  ['Swahili', 'Hujambo'],
  ['Swedish', 'Hallå'],
  ['Tahitian', 'Ia orna'],
  ['Thai', 'Sawasdee'],
  ['Tsonga', 'Avuxeni'],
  ['Turkish', 'Merhaba'],
  ['Ukrainian', 'Zdravstvuyte'],
  ['Urdu', 'Assalamo aleikum'],
  ['Vietnamese', 'xin chào'],
  ['Welsh', 'Shwmae'],
  ['Zulu', 'Sawubona'],
];

const entities = {
  'clear-night': '',
  'clear-day': '',
  'partly-cloudy-day': '',
  'partly-cloudy-night': '',
  'cloudy': '',
  'fog': '',
  'wind': '',
  'rain': '',
  'sleet': '',
  'snow': '',
  'hail': '',
  'thunderstorm': ''
};

const days = [
  'Sonntag',
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag'
];

const images = {};

const dirFiles = fs.readdirSync('./fonts/OpenMoji/openmoji-72x72-black/');
const emojiDay = dirFiles[Math.floor(Math.random() * dirFiles.length)].split('.')[0];

// TODO: Asian font glyps 
const fontPath = './fonts/Share_Tech_Mono/ShareTechMono-Regular.ttf';
const weatherFontPath = './fonts/weathericons/weathericons-regular-webfont.ttf';
// const emojiFontPath = './fonts/OpenMoji/OpenMoji-Black.ttf';

Promise.all([
  ['rand', emojiDay],
  ['calendar', '1F4C5'],
  ['calendarWhite', '1F4C5-i'],
  ['mail', '1F4E8'],
  ['smile', '1F600']
].map((imgObj) => {
  return gd.createFromPng('./fonts/OpenMoji/openmoji-72x72-black/' + imgObj[1] + '.png')
    .then((img) => {
      images[imgObj[0]] = img;
      return;
    });
})).then((assets) => {

  const epdImg = epd7x5.getImageBuffer();
  gd.createTrueColor(iWidth, iHeight).then(async (img) => {
    let offsetY = 0;
    // background
    const white = img.colorAllocate(255, 255, 255);
    const black = img.colorAllocate(0, 0, 0);
    img.filledRectangle(0, 0, iWidth, iHeight, white);
    img.filledRectangle(0, 0, iWidth, 100, black);

    // Emoji of the day
    // const emojiDayDisplay = (emojiDay.length > 8) ? emojiDay.substring(0,8) + '…' : emojiDay;
    // let bbox = bboxCalc(img, emojiDayDisplay, 12, fontPath);
    // img.stringFT(txtColor, fontPath, 12, 0, dWidth - 72 - padding + ((72 - bbox.width)/2), 2 * padding + 72, emojiDayDisplay);
    // images.rand.copy(img, dWidth - 72 - padding, padding, 0, 0, 72, 72, 72, 72);

    images.calendarWhite.copy(img, padding, padding, 0, 0, 72, 72);

    // Hello Date
    const hello = hellos[Math.floor(hellos.length * Math.random())][1];
    const today = new Date();
    const todayStr = ((today.getDate() < 10) ? '0' : '') + (today.getDate()) + '.' +
      ((today.getMonth()+1 < 10) ? '0' : '') + (today.getMonth()+1) + '.' +
      today.getFullYear();
      
    img.stringFT(white, fontPath, 16, 0, padding * 2 + 72, 26  + padding, days[today.getDay()]);
    img.stringFT(white, fontPath, 24, 0, padding * 2 + 72 - 2, 24  + padding + 36, todayStr);

    offsetY += 100 + padding;

    await cal.setup();
    const calHeight = await cal.draw(padding, offsetY, img, images.calendar, fontPath);

    offsetY += calHeight;

    img.line(0, offsetY, iWidth, offsetY, black);

    offsetY += padding;

    await mail.setup();
    const mailHeight = await mail.draw(padding, offsetY, img, images.mail, fontPath);

    offsetY += mailHeight;

    img.line(0, offsetY, iWidth, offsetY, black);

    offsetY += padding;

    await w.setup();
    await w.draw(padding, offsetY, img, weatherFontPath, entities, fontPath, iHeight - offsetY - padding, iWidth - 2 * padding);

    img.copyRotated(epdImg, 0, 0, 0, 0, dWidth, dHeight, 90);

    epd7x5.displayImageBuffer(epdImg);
  });
});
