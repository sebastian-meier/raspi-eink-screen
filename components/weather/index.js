const {httpsGet} = require('../../utils');

class compWeather {
  constructor () {}

  dataObj = { data: { today: null, tomorrow: null } };
  
  dateStr = (d) => {
    return `${d.getFullYear()}-${d.getMonth()<9?'0':''}${d.getMonth()+1}-${d.getDate()<10?'0':''}${d.getDate()}`;
  };



  setup = () => {
    return new Promise((resolve, rejects) => {
      const today = new Date();
      const dateToday = this.dateStr(today);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateTomorrow = this.dateStr(tomorrow);

      Promise.all([['today', dateToday], ['tomorrow', dateTomorrow]].map((dataSet) => {
        return httpsGet(`https://api.brightsky.dev/weather?lat=${process.env.LAT}&lon=${process.env.LON}&date=${dataSet[1]}`)
          .then((data) => {
            this.dataObj.data[dataSet[0]] = JSON.parse(data);
          });
      }))
      .then(() => resolve())
      .catch((err) => {
        reject(err);
      });
    });
  };

  barHeight = (value, min, max, height, type) => {
    const perc = (value - min) / (max - min);
    if (type === 'log') {
      return Math.log(1 + (Math.E-1) * perc) * height;
    } else {
      return height * perc;
    }
  };
 
  draw = (gd, offsetX, offsetY) => {
    // key, min, (mid,) max
    const attrs = [['temperature', 0, 40], ['precipitation', 0, 100]]; //, ['temperature', -20, 0, 40]];
    const color1 = gd.colorAllocate(255, 0, 255);

    const bHeight = 50;
    const bYPad = 20;
    const bWidth = 3;
    const bXPad = 2;

    // todo add max value text

    attrs.forEach((attr, ai) => {
      const hours = this.dataObj.data.today.weather;
      hours.forEach((hour, hi) => {
        const y = (bHeight + bYPad) * ai;
        const val = hour[attr[0]];
        // handle negative value 
        // check if negative exists
        // add 0-line 
        gd.filledRectangle(
          hi * (bWidth + bXPad),
          y,
          hi * (bWidth + bXPad) + bWidth,
          y + 
          this.barHeight(
            val,
            attr[1],
            attr[2],
            bHeight
          ),
          color1
        );
      });
    });
  };
}

module.exports = compWeather;