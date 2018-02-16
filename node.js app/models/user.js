var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    
    //profile data
    username: String,
    password: String,
    firstname: String,
    lastname: String,
    email: String,
    phone: Number,
    country: String,
    city: String,
    registrationDate: Date,
    
    //preferences
    alwaysCenterCity: Boolean,      // map is always centered on user's city, when available
    dataEconomy: Boolean,           // when activated, less data is transmitted 
    maxLines: Number,               // number of tiles displayed vertically on the map
    maxColumns: Number,             // number of tiles displayed horizontally on the map
    
    //user permission levels
    isContributor: Boolean,         // allows a user to upload a measurement
    isEditor: Boolean,              // allows a user to add an article
    isApprover: Boolean,            // allows a user to approve a measurement or an article
    isAdmin: Boolean                // allows a user to edit users permission levels
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);