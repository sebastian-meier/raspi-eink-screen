const gd = require('node-gd');
const fs = require('fs');
const {bboxCalc} = require('./utils');
require('dotenv').config();

const dWidth = 640;
const dHeight = 384;
const padding = 10;

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
  'sunny': ''
};

const images = {};

const dirFiles = fs.readdirSync('./fonts/OpenMoji/openmoji-72x72-black/');
const emojiDay = dirFiles[Math.floor(Math.random() * dirFiles.length)].split('.')[0];

// TODO: Asian font glyps 
const fontPath = './fonts/Share_Tech_Mono/ShareTechMono-Regular.ttf';
const weatherFontPath = './fonts/weathericons/weathericons-regular-webfont.ttf';
const emojiFontPath = './fonts/OpenMoji/OpenMoji-Black.ttf';

Promise.all([
  ['rand', emojiDay],
  ['calendar', '1F4C5'],
  ['mail', '1F4E8'],
  ['smile', '1F600']
].map((imgObj) => {
  return gd.createFromPng('./fonts/OpenMoji/openmoji-72x72-black/' + imgObj[1] + '.png')
    .then((img) => {
      images[imgObj[0]] = img;
      return;
    });
})).then((assets) => {

  gd.create(dWidth, dHeight).then(async (img) => {
    // background
    img.colorAllocate(255, 255, 255);
    const txtColor = img.colorAllocate(0, 0, 0);

    // Emoji of the day
    const emojiDayDisplay = (emojiDay.length > 8) ? emojiDay.substring(0,8) + '…' : emojiDay;
    let bbox = bboxCalc(img, emojiDayDisplay, 12, fontPath);
    img.stringFT(txtColor, fontPath, 12, 0, dWidth - 72 - padding + ((72 - bbox.width)/2), 2 * padding + 72, emojiDayDisplay);
    images.rand.copy(img, dWidth - 72 - padding, padding, 0, 0, 72, 72, 72, 72);

    // Hello Date
    const hello = hellos[Math.floor(hellos.length * Math.random())][1];
    const today = new Date();
    const todayStr = ((today.getDate() < 10) ? '0' : '') + (today.getDate()) + '.' +
      ((today.getMonth()+1 < 10) ? '0' : '') + (today.getMonth()+1) + '.' +
      today.getFullYear();
    img.stringFT(txtColor, fontPath, 24, 0, 10, 34, todayStr + ', ' + hello);

    // await mail.setup();
    // await mail.draw(padding, 24 + 2 * padding, img, images.mail, fontPath);
    
    await cal.setup();
    await cal.draw(padding, 24 + 2 * padding, img, images.calendar, fontPath);
    // w.setup().then(() => {
    //   w.draw(img, 0, 0);
    //   return img.savePng('output.png', 1);
    // }).then(() => {
    //   img.destroy();
    //   console.log('DONE');
    // });
    // cal.setup()
    //   .then(() => cal.draw());
    // mail.setup();
    return img.savePng('output.png', 1);
  });
});
