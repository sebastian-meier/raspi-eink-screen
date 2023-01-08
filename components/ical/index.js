const {httpsGet, bboxCalc} = require('../../utils');
const ical = require('node-ical');
const translations = require('../../translations.json');

class compCalendar {

  constructor () {}

  lang = process.env.LANGUAGE;

  calendars = [];

  nextEvents = [];

  setup() {
    this.calendars = process.env.CALENDARS.split(',');
    return Promise.all(this.calendars.map(c => {
      return httpsGet(c)
        .then(data => {
          const today = new Date();
            today.setHours(0);
            today.setMinutes(0);
            today.setSeconds(0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const events = ical.parseICS(data);
          Object.keys(events).forEach((e) => {
            if (!['refresh-interval', 'vcalendar'].includes(e)) {
              const ee = events[e];
              if (ee.type === 'VEVENT') {
                let eDate = ee.start;
                if (eDate.dateOnly) {
                  eDate.setHours(eDate.getHours()+1);
                }
                if (ee.start >= today && ee.start <= tomorrow) {
                  this.nextEvents.push({
                    title: ee.summary,
                    date: (ee.start.getDate() === today.getDate()) ? translations.today[this.lang] : translations.tomorrow[this.lang]
                  });
                }
              }
            }
          });
        });
    }));
  }

  draw(x, y, img, calImg, font) {
    const txtColor = img.colorAllocate(0, 0, 0);

    let offsetY = 0;

    if (this.nextEvents.length < 1) {
      calImg.copyResized(img, x, y + offsetY, 0, 0, 36, 36, 72, 72);
      img.stringFT(txtColor, font, 18, 0, x + 40, y + 26 + offsetY, translations.no_events[this.lang]);
    } else {
      this.nextEvents.forEach((event) => {
        calImg.copyResized(img, x, y + offsetY, 0, 0, 36, 36, 72, 72);
        img.stringFT(txtColor, font, 18, 0, x + 40, y + 26 + offsetY, event.date);
        let bbox = bboxCalc(img, event.date, 18, font);
        img.line(x, y + 36 + offsetY, x + 40 + bbox.width, y + 36 + offsetY, txtColor);
        img.stringFT(txtColor, font, 18, 0, x, y + 66 + offsetY, event.title);
        bbox = bboxCalc(img, event.title, 18, font);
        offsetY += 66 + bbox.height;
      });
    }
  }
}

module.exports = compCalendar;