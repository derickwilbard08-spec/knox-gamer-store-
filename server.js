
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

app.use(session({
  secret: 'knox_secret',
  resave: false,
  saveUninitialized: true
}));

const db = new sqlite3.Database('./data/store.db');

// INIT DB
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price INTEGER,
    platform TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gameId INTEGER,
    code TEXT,
    used INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gameId INTEGER,
    name TEXT,
    phone TEXT,
    txId TEXT,
    code TEXT
  )`);
});

// ADMIN LOGIN (simple)
const ADMIN = { user:"admin", pass:"1234" };

app.post('/api/login', (req,res)=>{
  if(req.body.user === ADMIN.user && req.body.pass === ADMIN.pass){
    req.session.admin = true;
    return res.json({ok:true});
  }
  res.json({ok:false});
});

function auth(req,res,next){
  if(req.session.admin) next();
  else res.status(401).json({error:"unauthorized"});
}

// GET games
app.get('/api/games',(req,res)=>{
  db.all("SELECT * FROM games",(err,rows)=>res.json(rows));
});

// ADD game
app.post('/api/add-game', auth, (req,res)=>{
  db.run("INSERT INTO games(name,price,platform) VALUES(?,?,?)",
  [req.body.name,req.body.price,req.body.platform]);
  res.json({ok:true});
});

// BUY GAME -> unique code
app.post('/api/buy',(req,res)=>{
  const {gameId,name,phone,txId} = req.body;

  db.get("SELECT * FROM codes WHERE gameId=? AND used=0 LIMIT 1",[gameId],(err,row)=>{
    if(!row) return res.json({message:"No codes available"});

    const code = row.code;

    db.run("UPDATE codes SET used=1 WHERE id=?",[row.id]);
    db.run("INSERT INTO orders(gameId,name,phone,txId,code) VALUES(?,?,?,?,?)",
    [gameId,name,phone,txId,code]);

    res.json({code});
  });
});

// ADD CODE STOCK (admin)
app.post('/api/add-code', auth, (req,res)=>{
  db.run("INSERT INTO codes(gameId,code,used) VALUES(?,?,0)",
  [req.body.gameId, req.body.code]);
  res.json({ok:true});
});

app.listen(3000,()=>console.log("Knox Gamer Store V2 running"));
