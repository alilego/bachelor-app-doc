
//Arduino serial reading library
#include <SoftwareSerial.h>

//Arduino SD card library
#include <SD.h>

//3rd party GPS library (TinyGPS library by Mikal Hart)
#include "TinyGPS.h"

//3rd party MQ-135 library (required for calibration and ppm extraction based on analog data)
//article on how to use the library: https://hackaday.io/project/3475-sniffing-trinket/log/12363-mq135-arduino-library
#include "MQ135.h"

#define SD_FILE_NAME   "AirQualityData.txt"
#define READ_INTERVAL   2000                    //time in millis

#define A0              0
#define A1              1
#define A2              2

#define MQ9             0
#define MQ135_A         1
#define MQ4             2

#define CO              0
#define CO2             1
#define NH4             2

/// Atmospheric CO2 level for calibration purposes
#define CO2_ATM         420

/// Atmospheric CO level for calibration purposes
#define CO_ATM          0

/// Atmospheric NH4 level for calibration purposes
#define NH4_ATM         1.44


#define DEBUG
//#define DEBUG_DETAILED

TinyGPS gps;
//serial ports for GPS module read/write: 
#define RXD             4
#define TXD             3
SoftwareSerial gpsSS(RXD, TXD);


//indicative value as read from MQ-4 sensor
//  high sensitivity to: Methane CH4
//  used to read mainly METHANE
int mq4_sensorValue;
int mq4_r0;
//float ch4_ppm;

//indicative value as read from MQ-9 sensor
//  high sensitivity to: Methane, Propane and CO
//  used to read mainly CO
int mq9_sensorValue;
int mq9_r0;
//float co_ppm;

//indicative value as read from MQ-135 sensor
//  high sensitivity to: NH3, Nx, alcohol, Benzene, smoke, CO2 
//  used to read mainly: CO2, GENERIC AIR QUALITY
int mq135_sensorValue;
int mq135_r0;
float co2_ppm;

MQ135 mq135_gasSensor = MQ135(A1);


//SD storage file
File SDfile;
//SD flag
//  if an SD card is available, the data will be stored on SD
//  else, the data will be sent via serial interface
bool SDfound = false;

bool gpsDataAvailable = true;

void setup(){
  //Assumption: Serial is configured to read at 9600 baud rate (Serial monitor to be configured similarly)
  Serial.begin(9600);

  initializeGPS();
  initializeSDcard();
  Serial.println("----------------------------------------------------------------------------");

  Serial.println("Calibrating sensors...");
  Serial.print("MQ135 R0 for CO2 = ");
  mq135_r0 = mq135_gasSensor.getRZero();
  Serial.println(mq135_r0);
  Serial.print("MQ9 R0 for CO = ");
  mq9_r0 = analogRead(MQ9);
  Serial.println(mq9_r0);
  Serial.print("MQ4 R0 for NH4 = ");
  mq4_r0 = analogRead(MQ4);
  Serial.println(mq4_r0);
  Serial.println("-----------------------------------------------------------------------------");

  //print table header
  Serial.println("S|HD|LAT    |LONG   |DateTime               |Age|MQ4|MQ9|MQ135|CO2_ppm"); 
  Serial.println("a|OP");
   Serial.println("t");
  Serial.println("s");
  Serial.println("------------------------------------------------------------------------------");
}

/**************************************************************************************************
 @brief Loops forever to log gps and gas sensor data
***************************************************************************************************/
void loop(){
  // For the defined time (READ_INTERVAL, default = 2sec) we parse GPS data and report some key values
  gpsDataAvailable = readwriteGpsData();    //here GPS data is also logged
  
  if (gpsDataAvailable){
    //read & write gas sensors values
    readwriteGasSensorValues();             //here gas sensor data is logged
    
    //end line
    if(!SDfound){
      Serial.println();
    }else{
      SDfile.println();
    }
  }
}

/**************************************************************************************************
 @brief Tries to initialize the SD card and open a file to store air quality data
          - if an SD card is available, the data will be stored on SD -> SDfound flag is set to TRUE
          - else, the data will be sent via serial interface -> SDfound flag is set to FALSE 
***************************************************************************************************/
void initializeSDcard(){
  Serial.print("Initializing SD card...");
  
  // Note that even if it's not used as the CS pin, the hardware SS pin 
  // (10 on most Arduino boards, 53 on the Mega) must be left as an output 
  // or the SD library functions will not work. 
  pinMode(10, OUTPUT);

  if (!SD.begin(10)) {
    Serial.println("initialization failed!");
    SDfound = false;
    return;
  }
  SDfound = true;
  Serial.println("initialization done.");

  // open the storage file. note that only one file can be open at a time,
  // so we need to close this one before opening another.
  SDfile = SD.open(SD_FILE_NAME, FILE_WRITE);
 
  // if the file opened okay, write to it:
  if (SDfile) {
    Serial.print("Writing to ");
    Serial.print(SD_FILE_NAME);
    Serial.println("...");
    SDfound = true;    
  } else {
    // if the file didn't open, we assume SD is not available and send the data via standard serial interface
    Serial.print("Error opening ");
    Serial.println(SD_FILE_NAME);
    SDfound = false;
  }
  Serial.println();
  Serial.println("Printing to standard output...");
  Serial.println();
}

void initializeGPS(){
  //GPS module interface is by default RS232 CMOS at 9600 bps
  gpsSS.begin(9600);

  Serial.println("USING: ");
  Serial.print("Simple TinyGPS library v. "); Serial.println(TinyGPS::library_version());
  Serial.println("by Mikal Hart");
  Serial.println(); 
}

/**************************************************************************/
/*!
@brief  Retrieve and write gas sensors data to serial
/**************************************************************************/
void readwriteGasSensorValues(){
 
  mq9_sensorValue = analogRead(A0);         // read analog input pin A0
//  ch4_ppm = computeGasConcentrationValue(NH4, mq9_sensorValue);
  
  mq135_sensorValue = analogRead(A1);       // read analog input pin A1
  co2_ppm = mq135_gasSensor.getPPM();
  //mq135_r0 = mq135_gasSensor.getRZero();
  //co2_ppm = mq135_gasSensor.getPPMUpdated(mq135_r0);
  
  mq4_sensorValue = analogRead(A2);         // read analog input pin A2
//  co_ppm = computeGasConcentrationValue(CO, mq4_sensorValue);
  
  if (SDfile){
    SDfile.print(mq4_sensorValue, DEC);
    SDfile.print("|");
    SDfile.print(mq9_sensorValue, DEC);
    SDfile.print("|");
    SDfile.print(mq135_sensorValue, DEC);
    SDfile.print("|");
    SDfile.print(co2_ppm, 2);
  }else{
    Serial.print(mq4_sensorValue, DEC);
    Serial.print("|");
    Serial.print(mq9_sensorValue, DEC);
    Serial.print("|");
    Serial.print(mq135_sensorValue, DEC);
    Serial.print("|");
    Serial.print(co2_ppm, 2);
  }  
}

/**************************************************************************/
/*!
@brief  Compute & return gas concentration
@param gas - either CO, CO2 or NH4
       sensorValue - analog value read from sensor
/**************************************************************************/
/*
float ratio, c;
float computeGasConcentrationValue(int gas, int sensorValue){

  ratio, c = 0;
    
  switch(gas)
    {
        case CO2:
        {
            c = mq135_gasSensor.getPPM();
        }
        case CO:
        {
            //sensorValue - resistance value at the moment
            //res0 - specific resistance value as retrieved from calibration
            ratio = (float)sensorValue / mq4_r0;
            if(ratio < 0.01) ratio = 0.01;
            if(ratio > 3) ratio = 3;
            //c = pow(10, 0.6) / pow(ratio, 1.2);
            c = pow(ratio, -1.179)*4.385;  
            break;
        }
        case NH4:  //add by jack
        {
            //sensorValue - resistance value at the moment
            //res0 - specific resistance value as retrieved from calibration
            ratio = (float)sensorValue / mq9_r0;
            if(ratio < 0.5) ratio = 0.5;
            if(ratio > 0.7) ratio = 0.7;
            c = pow(ratio, -4.363)*630.957;
            break;
        }
        default:
            break;
    }

    return c;
}
*/

/**************************************************************************/
/*!
@brief  Retrieve and write GPS data to serial
/**************************************************************************/
bool readwriteGpsData(){
  gpsDataAvailable = true;
  unsigned short chars = 0, sentences = 0, failed = 0;

  //read GPS data for some time
  for (unsigned long start = millis(); millis() - start < READ_INTERVAL;)
  {
    while (gpsSS.available())
    {
      char c = gpsSS.read();
      //Serial.write(c); // uncomment this line to see the GPS data flowing
      if (gps.encode(c)){ // Did a new valid sentence come in?
        gpsDataAvailable = true;
      }else{
#ifndef DEBUG
        gpsDataAvailable = false;
#endif
      }
    }
  }
  
#ifdef DEBUG_DETAILED
  if (chars == 0)
    Serial.println(" ** No characters received from GPS: check wiring **");
  gps.stats(&chars, &sentences, &failed);
  Serial.print(" CHARS=");
  Serial.print(chars);
  Serial.print(" SENTENCES=");
  Serial.print(sentences);
  Serial.print(" CSUM ERR=");
  Serial.println(failed);
#endif

  if (gpsDataAvailable)
  {
    float flat, flon;
    unsigned long age, date, time;
    gps.f_get_position(&flat, &flon, &age);
    print_int(gps.satellites(), TinyGPS::GPS_INVALID_SATELLITES);
    print_int(gps.hdop(), TinyGPS::GPS_INVALID_HDOP);
    gps.f_get_position(&flat, &flon, &age);
    print_float(flat, TinyGPS::GPS_INVALID_F_ANGLE, 6);
    print_float(flon, TinyGPS::GPS_INVALID_F_ANGLE, 6);
    print_date(gps);
  }

  return gpsDataAvailable;
}

/**************************************************************************/
/*!
@brief  Print formatted float onto either:
            SD card, if available
            serial monitor, if SD card not available
        Pipe format used
        If the value isn't valid, 0 is printed instead

@params val - value to be written
        invalid - validation flag
        prec - precision
/**************************************************************************/
static void print_float(float val, float invalid, int prec)
{
  if (SDfile){
    SDfile.print(val == invalid ? 0.0 : val, prec);
    SDfile.print("|");
  }else{
    Serial.print(val == invalid ? 0.0 : val, prec);
    Serial.print("|");
  }
}

/**************************************************************************/
/*!
@brief  Print int onto either:
            SD card, if available
            serial monitor, if SD card not available
        Pipe format used
        If the value isn't valid, 0 is printed instead

@params val - value to be written
        invalid - validation flag
/**************************************************************************/
static void print_int(unsigned long val, unsigned long invalid)
{
  if (SDfile){
    SDfile.print(val == invalid ? 0 : val);
    SDfile.print("|");
  }else{
    Serial.print(val == invalid ? 0 : val);
    Serial.print("|");
  }
}

/**************************************************************************/
/*!
@brief  Print string onto either:
            SD card, if available
            serial monitor, if SD card not available
        Pipe format used

@params str - address to start of string
        len - string length
/**************************************************************************/
static void print_str(const char *str, int len)
{
  int slen = strlen(str);
  if (SDfile){
    for (int i=0; i<len; ++i)
      SDfile.print(i<slen ? str[i] : ' ');
    SDfile.print("|");
  }else{
    for (int i=0; i<len; ++i)
      Serial.print(i<slen ? str[i] : ' ');
    Serial.print("|");
  }
}

/**************************************************************************/
/*!
@brief  Print formatted date based on GPS data: "MM/dd/yy hh:mm:ss onto either:
            SD card, if available
            serial monitor, if SD card not available
        Pipe format used

@params gps - TinyGPS object associated to GPS sensor
/**************************************************************************/
static void print_date(TinyGPS &gps)
{
  int year;
  byte month, day, hour, minute, second, hundredths;
  unsigned long age;
  gps.crack_datetime(&year, &month, &day, &hour, &minute, &second, &hundredths, &age);
  char sz[32];
  sprintf(sz, "%02d/%02d/%02d %02d:%02d:%02d ", month, day, year, hour, minute, second);
  if (SDfile){
    SDfile.print(sz);
    SDfile.print("|");
    SDfile.print(age);
    SDfile.print("|");
  }else{
    Serial.print(sz);
    Serial.print("|");
    Serial.print(age);
    Serial.print("|");
  }
}
