const {httpsGet} = require('../../utils');

class compWeather {
  constructor () {}

  dataObj = { data: { today: null, tomorrow: null } };
  
  dateStr = (d) => {
    return `${d.getFullYear()}-${d.getMonth()<9?'0':''}${d.getMonth()+1}-${d.getDate()<10?'0':''}${d.getDate()}`;
  };



  setup = () => {
    return new Promise((resolve, reject) => {
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

  drawLine = (img, offsetX, offsetY, data, key, min, max, width, height) => {
    const black = img.colorAllocate(0, 0, 0);
    const points = [];
    const step = (width - 50) / data.length;
    data.forEach((d, di) => {
      const y = offsetY + height - 4 - (height - 8) / (max - min) * (d[key] - min);
      const x = offsetX + step * (di + 0.5) + 25;
      points.push({x,y});
    });
    points.forEach((p, pi) => {
      if (pi > 0) {
        img.line(p.x, p.y, points[pi-1].x, points[pi-1].y, black);
      }
      img.filledEllipse(p.x, p.y, 5, 5, black);
    });
  };

  drawBars = (img, offsetX, offsetY, data, key, min, max, width, height) => {
    const red = img.colorAllocate(255, 0, 0);
    const step = (width - 50) / data.length;
    data.forEach((d, di) => {
      if (d[key] > 0) {
        const y = offsetY;
        const x = offsetX + step * di + 25;
        const p = (d[key] - min) / (max - min);
        const h = Math.log(1 + (Math.E-1) * p) * (height - 8);
        img.filledRectangle(x, y + height - 4 - h, x + step, y + height - 4, red);
      }
    });
  };

  drawScale = (img, x, y, temps, precip, height, font, width) => {
    const black = img.colorAllocate(0, 0, 0);
    const red = img.colorAllocate(255, 0, 0);
    temps.forEach((t, i) => {
      img.stringFT(black, font, 8, 0, x - 5, y + 8 + i * (height - 8) / (temps.length - 1), t + '°');
      img.stringFT(red, font, 8, 0, x + width - 20, y + 8 + i * (height - 8) / (temps.length - 1), Math.round(precip[precip.length - 1 - i]) + ((precip[precip.length - 1 - i] === 0) ? 'mm' : ''));
      img.dashedLine(
        x + 25,
        y + i * (height - 8) / (temps.length - 1) + 4,
        x + width - 25,
        y + i * (height - 8) / (temps.length - 1) + 4,
        black
      );
    });
  };

  drawIcons = (img, x, y, data, width, height, font, entities) => {
    const black = img.colorAllocate(0, 0, 0);
    const step = (width - 50) / data.length;
    for (let i = 1; i < data.length - 1; i += 2) {
      img.stringFT(black, font, 12, 0, x + 25 + step * (i + 0.5) - 7, y + height + 17, entities[data[i].icon]);
    }
  };
 
  draw = (offsetX, offsetY, img, weatherFont, entities, font, height, width) => {
    const black = img.colorAllocate(0, 0, 0);

    const temps = [' 30',' 20',' 10','  0','-10'];
    const precip = [];
    temps.forEach((t, ti) => {
      precip.push(100 - Math.log(1 + (Math.E-1) * (ti / (temps.length - 1))) * 100);
    });
    precip.reverse();

    for (let i = 1; i < 25; i += 2) {
      img.stringFT(black, font, 8, 0, offsetX + 25 + i * (width - 50) / 25 + 2, offsetY + 8, ((i < 10) ? '0' : '') + i);
    }

    ['today', 'tomorrow'].forEach((day, di) => {
      this.drawScale(img, offsetX, 10 + offsetY + (height + 5) / 2 * di, temps, precip, height / 2 - 30, font, width);
      this.drawBars( img, offsetX, 10 + offsetY + (height + 5) / 2 * di, this.dataObj.data[day].weather, 'precipitation', 0, 100, width, height / 2 - 30)
      this.drawLine( img, offsetX, 10 + offsetY + (height + 5) / 2 * di, this.dataObj.data[day].weather, 'temperature', -10, 30, width, height / 2 - 30);  
      this.drawIcons(img, offsetX, 10 + offsetY + (height + 5) / 2 * di, this.dataObj.data[day].weather, width, height / 2 - 30, weatherFont, entities)
    });
  };
}

module.exports = compWeather;