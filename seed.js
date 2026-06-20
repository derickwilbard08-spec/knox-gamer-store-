
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/store.db');

db.serialize(()=>{
  db.run("INSERT INTO games(name,price,platform) VALUES('GTA San Andreas',5000,'PS/PC')");
  db.run("INSERT INTO games(name,price,platform) VALUES('FIFA 14 Mod',3000,'Android')");
  db.run("INSERT INTO games(name,price,platform) VALUES('PPSSPP Pack',7000,'PSP')");
});

console.log("seeded");
