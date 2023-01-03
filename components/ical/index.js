const {httpsGet} = require('../../utils');
const ical = require('node-ical');

class compCalendar {

  constructor () {}

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
          tomorrow.setDate(tomorrow.getDate() + 2);
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
                    date: (ee.start.getDate() === today.getDate()) ? 0 : 1
                  });
                }
              }
            }
          });
        });
    }));
  }

  draw(gd, offsetX, offsetY) {
    console.log(this.nextEvents);
  }
}

module.exports = compCalendar;