var express         = require("express");
var router          = express.Router();
var passport        = require("passport");
var User            = require("../models/user");
var Measurement     = require("../models/measurement");

var defaultBoundaries = {
        latMax:44.39474839127027,
        latMin:44.35732562972087,
        lngMax:26.186026354736327,
        lngMin:26.12251164526367
    }
var defaultCenter = {lat: 44.376040, lng: 26.154269};

// landing page route
router.get("/", function(req, res){
  res.render("landing"); 
});

//map main page
router.get("/map", function(req, res){
    console.log("'/map' GET");
    //console.log(req.session);
    
    req.session.lastReq = 'GET';
    
    req.session.gmap = {};
    if(req.user){
        if(req.user.maxLines && (!req.user.dataEconomy || req.user.maxLines <= 8)){
            req.session.gmap.maxA = req.user.maxLines;
        } else {
            req.session.gmap.maxA = 8;    
        }
        if(req.user.maxColumns && (!req.user.dataEconomy || req.user.maxColumns <= 8)){
            req.session.gmap.maxB = req.user.maxColumns;
        } else {
            req.session.gmap.maxB = 8;    
        }
    } else {
        req.session.gmap.maxA = 4;
        req.session.gmap.maxB = 4;
    }
    req.session.gmap.boundaries = defaultBoundaries;
    req.session.gmap.zoom = 14;
    req.session.gmap.defaultCenter = defaultCenter;
    
    initGmapDefault(req, res);
});

router.post('/map', function(req, res){
	console.log("'/map' POST");
	//console.log(req.session);
	
	req.session.lastReq = 'POST';
	
	req.session.gmap.boundaries = {
	    latMin: Number(req.body.mapBoundaries.latMin),
        latMax: Number(req.body.mapBoundaries.latMax),
        lngMin: Number(req.body.mapBoundaries.lngMin),
        lngMax: Number(req.body.mapBoundaries.lngMax)
	}
	
	initGmapDefault(req, res);
});


function initGmapDefault(req, res){
    req.session.gmap.zones = [];
    req.session.gmap.a = 0; 
    req.session.gmap.b = 0;
    req.session.gmap.lngDelta = (req.session.gmap.boundaries.lngMax - req.session.gmap.boundaries.lngMin) / req.session.gmap.maxB;
    req.session.gmap.latDelta = (req.session.gmap.boundaries.latMax - req.session.gmap.boundaries.latMin) / req.session.gmap.maxA;
    req.session.gmap.lngMin = req.session.gmap.boundaries.lngMin + (req.session.gmap.b * req.session.gmap.lngDelta);
    req.session.gmap.lngMax = req.session.gmap.lngMin + req.session.gmap.lngDelta;
    req.session.gmap.latMin = req.session.gmap.boundaries.latMin + (req.session.gmap.a * req.session.gmap.latDelta);
    req.session.gmap.latMax = req.session.gmap.latMin + req.session.gmap.latDelta;
    
    //console.log("maxA, maxB, a, b, long, lat " + maxA + " " + maxB + " " + a + " " + b + " " + latMin + " " + latMax + " " + lngMin + " " + lngMax + " ");
    
    var getMeasurements = function(gmap, callback){
        Measurement.aggregate([
            {$match: {  long: { $gte: gmap.lngMin, $lte: gmap.lngMax },
                        lat: { $gte: gmap.latMin, $lte: gmap.latMax }}},
            {$group: {  _id: "$__v", 
                        averageMq4: {$avg: "$mq4"},
                        averageMq9: {$avg: "$mq9"},
                        averageMq135: {$avg: "$mq135"},
                        averageCo2ppm: {$avg: "$co2ppm"}}}
            ], function (err, measurement) {
                if(err){
                    console.log(err);
                } else {
                    callback(measurement);
                }
        });
    }
    
    getMeasurements(req.session.gmap, function retrieveMeasurement(measurement){
        //compute lat&long for storage
        var lngMin = req.session.gmap.boundaries.lngMin + (req.session.gmap.b * req.session.gmap.lngDelta);
        var lngMax = lngMin + req.session.gmap.lngDelta;
        var latMin = req.session.gmap.boundaries.latMin + (req.session.gmap.a * req.session.gmap.latDelta);
        var latMax = latMin + req.session.gmap.latDelta;
        
        if(measurement.length > 0){
            req.session.gmap.zones.push({
                latMin: latMin,
                latMax: latMax,
                lngMin: lngMin,
                lngMax: lngMax,
                mq4: measurement[0].averageMq4,
                mq9: measurement[0].averageMq9,
                mq135: measurement[0].averageMq135,
                co2ppm: measurement[0].averageCo2ppm,
            });
            //console.log(gmap);
        }
        
        //compute lat&long for next calculus
        if(req.session.gmap.a < (req.session.gmap.maxA - 1) && req.session.gmap.b < (req.session.gmap.maxB - 1)){ req.session.gmap.b++; }
        else if(req.session.gmap.a < (req.session.gmap.maxA - 1) && req.session.gmap.b == (req.session.gmap.maxB - 1)){ req.session.gmap.a++; req.session.gmap.b = 0; }
        else if(req.session.gmap.a == (req.session.gmap.maxA - 1) && req.session.gmap.b < (req.session.gmap.maxB - 1)){ req.session.gmap.b++; }
        else {
            renderMain(req, res);
            return;
        }
        lngMin = req.session.gmap.boundaries.lngMin + (req.session.gmap.b * req.session.gmap.lngDelta);
        lngMax = lngMin + req.session.gmap.lngDelta;
        latMin = req.session.gmap.boundaries.latMin + (req.session.gmap.a * req.session.gmap.latDelta);
        latMax = latMin + req.session.gmap.latDelta;
        
        //console.log("maxA, maxB, a, b, long, lat " + maxA + " " + maxB + " " + a + " " + b + " " + latMin + " " + latMax + " " + lngMin + " " + lngMax + " ");
        
        Measurement.aggregate([
            {$match: {  long: { $gte: lngMin, $lte: lngMax },
                        lat: { $gte: latMin, $lte: latMax }}},
            {$group: {  _id: "$__v", 
                        averageMq4: {$avg: "$mq4"},
                        averageMq9: {$avg: "$mq9"},
                        averageMq135: {$avg: "$mq135"},
                        averageCo2ppm: {$avg: "$co2ppm"}}}
            ], function (err, measurement) {
                if(err){
                    console.log(err);
                } else {
                    retrieveMeasurement(measurement);
                }
        });
    })
    
    
}

function renderMain(req, res){
    // console.log("AVERAGE MEASUREMENTS: ");
    // console.log(req.session.gmap);
    //console.log(req.session.lastReq);
    try{
        if(req.session.lastReq === 'POST'){
            res.send(req.session.gmap);
        } else {
            res.render("main", {gmap: req.session.gmap});
        } 
    } catch (err) {
        console.log("ERROR: ");
        console.log(err);
    }
    
}

// show register form
router.get("/register", function(req, res){
  res.render("register"); 
});

//handle sign up logic
router.post("/register", function(req, res){
    console.log("REGISTER USER");
    var now = new Date();
    var newUser = new User({username: req.body.username,
                            maxLines: 4,
                            maxColumns: 4,
                            registrationDate: now
                            });
    console.log(newUser);
    // if(newUser.username === "alilego"){
    //     newUser.isContributor = true;
    //     newUser.isEditor = true;
    //     newUser.isApprover = true;
    //     newUser.isAdmin = true;
    // }
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            req.flash("error", err.message);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function(){
          req.flash("success", "Salut, " + user.username + "! Bine ai venit in comunitatea respir.info!");
          res.redirect("/map"); 
        });
    });
});

//show login form
router.get("/login", function(req, res){
  res.render("login"); 
});

//handling login logic
router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/map",
        failureRedirect: "/login"
    }), function(req, res){
});

// logout route
router.get("/logout", function(req, res){
  req.logout();
  req.flash("success", "La revedere!");
  res.redirect("/map");
});

//show static forms
router.get("/mission", function(req, res){
  res.render("articles/static_mission"); 
});

router.get("/pollution", function(req, res){
  res.render("articles/static_pollution"); 
});

module.exports = router;