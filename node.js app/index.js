var express         = require("express"),
    app             = express(),
    bodyParser      = require("body-parser"),
    mongoose        = require("mongoose"),
    flash           = require("connect-flash"),
    passport        = require("passport"),
    LocalStrategy   = require("passport-local"),
    methodOverride  = require("method-override"),
    path            = require('path'),
    formidable      = require('formidable'),
    fs              = require('fs'),
    favicon         = require('serve-favicon'),
    User            = require("./models/user"),
    Measurement     = require("./models/measurement");

app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));

//requiring routes
var indexRoutes      = require("./routes/index");
var userRoutes       = require("./routes/users");
var actionRoutes     = require("./routes/actions");
var articleRoutes    = require("./routes/articles");

//initialising DB connection
mongoose.Promise = global.Promise;

//use this for local connection - change it for mLab
var promise = mongoose.connect('mongodb://localhost/respir_info', {
  useMongoClient: true,
  /* other options */
});

//initialising app & framework utils
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());


// initialising passport - for authentication
app.use(require("express-session")({
    // TODO Warning: connect.session() MemoryStore is not designed for a production environment, as it will leak memory, and will not scale past a single process.
    // cookie:{
    //             secure: true,
    //             maxAge: 300000
    //       },
    secret: "Folosim respir.info pentru informatii privind calitatea aerului. Masuram, calculam, informam. ASDF1234LEET1337",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// middleware to save data for local session
app.use(function(req, res, next){
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

app.use("/", indexRoutes);
app.use("/user", userRoutes);
app.use("/action", actionRoutes);
app.use("/articles", articleRoutes);

// TODO Warning: connect.session() MemoryStore is not designed for a production environment, as it will leak memory, and will not scale past a single process.
// function sessionCleanup() {
//     sessionStore.all(function(err, sessions) {
//         for (var i = 0; i < sessions.length; i++) {
//             sessionStore.get(sessions[i], function() {} );
//         }
//     });
// }

function clearDB(){
    //Remove all users
    // User.remove({}, function(err){
    //     if(err){
    //         console.log(err);
    //     }
    //     console.log("REMOVED ALL USERS!");
    // });
    
    //Remove all measurements
    // Measurement.remove({}, function(err){
    //     if(err){
    //         console.log(err);
    //     }
    //     console.log("REMOVED ALL MEASUREMENTS!");
    // });
    
    //Remove all articles
    // Article.remove({}, function(err){
    //     if(err){
    //         console.log(err);
    //     }
    //     console.log("REMOVED ALL ARTICLES!");
    // });
}
//clearDB();

app.listen(8080, 'localhost', function(){
   console.log("respir.info server has started...");
   console.log("Listening on localhost port 8080");
});