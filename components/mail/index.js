const Imap = require('imap');

class compMail {
  constructor() {}

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
      const f = imap.seq.fetch(res.slice(res.length - 2), {
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
              const message = buffer.split('\r\n').filter((l, li) => (li <= 4 && (li%2 === 0)));
              note.url = message[0];
              note.tags = message[1].split(',').map(t => t.trim());
              note.description = message[2];
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
      const notes = await this.imapFetch(imap, res);
      console.log(notes);
    }

    imap.end();
  }

  draw() {

  }
}

module.exports = compMail;