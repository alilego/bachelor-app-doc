var express         = require("express"),
    router          = express.Router(),
    path            = require('path'),
    formidable      = require('formidable'),
    fs              = require('fs'),
    rs              = require('readline');
    
var User            = require("../models/user");
var Measurement     = require("../models/measurement");
var middleware      = require("../middleware");

// Show form to upload measurements file
router.get("/measurements/add", middleware.isContributor, function(req, res){
    res.render("actions/measurement_upload");
});

// app.get('/', function(req, res){
//   res.sendFile(path.join(__dirname, 'views/index.html'));
// });

router.post('/measurements', middleware.isContributor, function(req, res){

    console.log("UPLOADING MEASUREMENTS FILE");
    
    var fileName = '';
    
    // create an incoming form object
    var form = new formidable.IncomingForm();
    
    // specify that we want to allow the user to upload multiple files in a single request
    form.multiples = true;
    
    // store all uploads in the /uploads directory
    form.uploadDir = path.join(__dirname, '../data/uploads');
    
    // every time a file has been uploaded successfully,
    // rename it to it's orignal name
    form.on('file', function(field, file) {
        fs.rename(file.path, path.join(form.uploadDir, file.name));
        fileName = file.name;
    });
    
    // log any errors that occur
    form.on('error', function(err) {
        console.log('An error has occured: \n' + err);
    });
    
    // once all the files have been uploaded, send a response to the client
    form.on('end', function() {
        res.end('Successfully loaded on server');
        console.log("File '" + fileName + "' successfully uploaded to " + form.uploadDir);
        // parse file data and store results in DB
        parseStoreMeasurements(path.join(form.uploadDir,fileName));
    });
    
    // parse the incoming request containing the form data
    form.parse(req);
});

function parseStoreMeasurements(filePath){
    console.log("Parsing '" + filePath + "'...");
    
    var lineReader = rs.createInterface({
        input: fs.createReadStream(filePath)
    });
    
    var nextStep = 'SEP_HDR';
    var fieldsMapping = {
        'LAT': 'lat',
        'LONG': 'long',
        'MQ4' : 'mq4',
        'MQ9': 'mq9',
        'MQ135': 'mq135',
        'CO2_ppm': 'co2ppm',
        'DateTime': 'time'
    }
    var linesplit, interpret = [];
    
    lineReader.on('line', function (line) {
        console.log('Line from file:', line);
        switch(nextStep){
            case 'SEP_HDR':         //waiting to identify the separator for header: '---------------------'
                if(line.indexOf('--------') !== -1){
                    nextStep = 'HDR';
                }
                break;
            case 'HDR':             //waiting to identify header fields order: 'S|HDP|LAT    |LONG   |DateTime               |Age|MQ4|MQ9|MQ135|CO2_ppm'
                if(line.indexOf('LONG') !== -1){
                    linesplit = line.split("|");
                    linesplit.forEach(function(element){
                        element = element.trim();
                        if(fieldsMapping[element]){
                            interpret.push(fieldsMapping[element]);
                        } else {
                            interpret.push('IGNORE');
                        }
                    });
                    console.log("INTERPRET:" + interpret);
                    nextStep = 'SEP_HDR_END';
                }
                break;
            case 'SEP_HDR_END':         //waiting to identify the separator for end of header: '---------------------'
                if(line.indexOf('--------') !== -1){
                    nextStep = 'DATA';
                }
                break;
            case 'DATA':                //read fields as specified in header and store them in the DB
                if(line.indexOf('|') == -1){
                    break;
                }
                linesplit = line.split("|");
                var newMeasurement = {};
                for (var i = 0; i < linesplit.length; i++) {
                    if(interpret[i] !== 'IGNORE'){
                        console.log("INTERPRET:" + i + " " + interpret[i] + " " + linesplit[i]);
                        newMeasurement[interpret[i]] = linesplit[i];        
                    }
                }
                if(Object.keys(newMeasurement).length === 7){
                    try{
                        Measurement.create(newMeasurement, function(err, newlyCreated){
                            if(err){
                                console.log(err);
                            } else {
                                console.log("MEASUREMENT ADDED to DB:");
                                console.log(newlyCreated);
                            }
                        })
                    } catch(err) {
                        console.log(err.message);
                    }
                } 
                break;
            default:
                break;
        }
    });
}

module.exports = router;