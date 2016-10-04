var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongo = require('mongodb');
var mongoose = require('mongoose');

var hbs = require('hbs');
hbs.registerHelper('dateFormat', require('handlebars-dateformat'));

mongoose.connect('mongodb://127.0.0.1:27017/buynsell_db');
var db = mongoose.connection;

var routes = require('./routes/client');
var admin = require('./routes/admin');


// Init App
var app = express();

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.engine('hbs', require('exphbs'));
app.set('view engine', 'hbs');

// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Set Static Folder
app.use(function(req, res, next) {
  req.headers['if-none-match'] = 'no-match-for-this';
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Express Session
app.use(session({
    secret: 'we are secure',
    saveUninitialized: true,
    resave: true,
    cookie: { maxAge: 3000000 }

}));

// Passport init
app.use(passport.initialize());
app.use(passport.session());



// Express Validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

// Connect Flash
app.use(flash());

// Global Vars
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});


app.use('/', routes);
app.use('/', admin);


//The 404 Route (ALWAYS Keep this as the last route)
app.get('*', function(req, res){
  res.status(404).send('Page Not Found');
});


// Set Port
//app.set('port', (process.env.PORT || 3000));

//app.listen(3000, '192.168.0.102');

app.listen(3000);

/*app.listen(app.get('port'), function(){
  console.log('Server started on port '+app.get('port'));
});
*/

module.exports = app;
