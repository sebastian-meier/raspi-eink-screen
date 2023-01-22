const Imap = require('imap');
const {bboxCalc} = require('../../utils');

class compMail {
  constructor() {}

  notes = [];

  notesLimit = 1;
  notesLineMax = 26;
  emailShorten = process.env.EMAIL_SHORTEN.split(';').map(e => e.split(','));

  allowedSenders = process.env.ALLOWED_SENDERS.split(',');

  imapConnect = () => {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: process.env.IMAP_USER,
        password: process.env.IMAP_PASSWORD,
        host: process.env.IMAP_SERVER,
        port: 993,
        tls: true
      });
  
      imap.once('ready', () => {
        resolve(imap);
      });
  
      imap.once('error', (err) => {
        reject(err);
      });
       
      imap.connect();
    });
  };
  
  imapOpen = (imap) => {
    return new Promise((resolve, reject) => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          reject(err);
        } else {
          resolve(box);
        }
      });
    });
  };
  
  imapSearch = (imap) => {
    return new Promise((resolve, reject) => {
      imap.search([['TO', process.env.NOTE_MAIL], this.nestedFromOr(this.allowedSenders)], (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  };

  // Thanks, cantoute: https://github.com/mscdex/node-imap/issues/571
  nestedFromOr = (from) => {
    let nestedFromOr;
    (Array.isArray(from) ? from : [from]).forEach((value, index) => {
      nestedFromOr = index
        ? ['OR', ['FROM', value], nestedFromOr]
        : ['FROM', value];
    });
    return nestedFromOr;
  };
  
  imapFetch = (imap, res) => {
    return new Promise((resolve, reject) => {
      const f = imap.seq.fetch(res.slice(res.length - this.notesLimit), {
        bodies: [
          'HEADER.FIELDS (DKIM-SIGNATURE FROM DATE SUBJECT)',
          '1',
        ],
        struct: true
      });
  
      const notes = [];
  
      f.on('message', (msg) => {
        const note = {};
        msg.on('body', (stream, info) => {
          let buffer = '';
          stream.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
          });
          stream.once('end', () => {
            if (parseInt(info.which) !== 1) {
              const els = Imap.parseHeader(buffer);
              Object.keys(els).forEach(key => {
                if (key === 'date') {
                  els[key][0] = Date.parse(els[key][0]);
                }
                note[key] = els[key][0];
              });
            } else {
              const message = [];
              const lines = buffer.split('-- \r\n')[0].split('\r\n');
              lines.forEach((line) => {
                if (message.length < 4) {
                  if (
                    line.length > 0 &&
                    line.substring(0,4) != '----' &&
                    line.substring(0, 8) != 'Content-'
                  ) {
                    while(line.length > this.notesLineMax) {
                      message.push(line.substring(0, this.notesLineMax));
                      line = line.substring(this.notesLineMax);
                    }
                    message.push(line);
                  }
                }
              });
              note.description = message.join('\r\n').trim();
            }
          });
        });
        msg.once('end', () => {
          notes.push(note);
        });
      });
  
      f.once('error', (err) => {
        reject(err);
      });
  
      f.once('end', () => {
        resolve(notes.reverse());
      });
    });
  };

  async setup() {
    const imap = await this.imapConnect();
    await this.imapOpen(imap);
    const res = await this.imapSearch(imap);

    if (res && res.length >= 1) {
      this.notes = await this.imapFetch(imap, res);
    }
    imap.end();
  }

  draw(x, y, img, mailImg, font) {
    const txtColor = img.colorAllocate(0, 0, 0);

    let offsetY = 0;

    this.notes.forEach((note) => {
      let from = note.from.split(' <')[0];
      this.emailShorten.forEach((e) => {
        if (from.toLowerCase().includes(e[0])) { from = e[1] }
      });
      from += ':';
      mailImg.copyResized(img, x, y + offsetY, 0, 0, 24, 24, 72, 72);
      img.stringFT(txtColor, font, 16, 0, x + 24, y + 18 + offsetY, from);
      let bbox = bboxCalc(img, from, 16, font);
      img.line(x, y + 22 + offsetY, x + 24 + bbox.width, y + 22 + offsetY, txtColor);
      img.stringFT(txtColor, font, 18, 0, x, y + 50 + offsetY, note.description);
      bbox = bboxCalc(img, note.description, 18, font);
      offsetY += 50 + bbox.height;
    });

    return offsetY;
  }
}

module.exports = compMail;