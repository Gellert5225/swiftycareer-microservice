const express         = require('express');
const methodOverride  = require('method-override');
const cors            = require('cors');
const session         = require('express-session');
const cookieParser    = require('cookie-parser');

const app = express();

require('dotenv').config({ path: `${__dirname }/.env.${process.env.NODE_ENV}` })

var corsOptions = {
  origin: "*",
  credentials: true 
};
  
app.use(cors(corsOptions));

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(session({
  secret: "Shh, its a secret!",
  saveUninitialized: false,
  resave: false
}));

require('../app.controller')(app);

// db.connect().then(result => {
//     require('../app.controller')(app);
//     init();
// })

const port = process.env.PORT || 3000;
const httpServer = require('http').createServer(app);
httpServer.listen(port, () => {
  console.log(`[${process.env.NODE_ENV}] SERVICE: AUTH running on port ${port}`);
});