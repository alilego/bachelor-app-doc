
/*  time, lat and long shall be created as indexes
        https://docs.mongodb.com/manual/tutorial/create-indexes-to-support-queries/
        https://docs.mongodb.com/manual/core/index-compound/
*/

var mongoose = require("mongoose");

var measurementSchema = new mongoose.Schema({
    time: Date,
    long: Number,
    lat: Number,
    mq4: Number,
    mq9: Number,
    mq135: Number,
    co2ppm: Number
});

module.exports = mongoose.model("Measurement", measurementSchema);