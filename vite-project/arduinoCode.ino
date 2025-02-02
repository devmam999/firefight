#include "DHT.h"
#include <WiFi.h>
#include <WebServer.h>

#define DPIN 26       //Pin to connect DHT sensor (GPIO number)
#define DTYPE DHT11   // Define DHT 11 or DHT22 sensor type
int ledPinR = 25;
int ledPinB = 25;
int ledPinG = 33;

// Web server on port 80
WebServer server(0001);


// Replace with your WiFi credentials
const char* ssid = "Sentry-Guest";
const char* password = "squashbugs";


DHT dht(DPIN,DTYPE);
int myCounter = 0;

bool stop = false;
 
void setup() {
  Serial.begin(115200); // baud number needs to match baud console
  pinMode(ledPinR, OUTPUT); // Set the LED pin as OUTPUT
  dht.begin();

    Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  
  Serial.println("Connected to WiFi");

  dht.begin();  // Initialize DHT sensor

  // Route to serve temperature and humidity data
  server.on("/data", HTTP_GET, [](){
    float temperature = dht.readTemperature(); // Get temperature
    float humidity = dht.readHumidity();       // Get humidity

    if (isnan(temperature) || isnan(humidity)) {
      server.send(500, "text/plain", "Failed to read from DHT sensor");
      return;
    }

    // Send data as JSON response
    String jsonResponse = "{\"temperature\": " + String(temperature) + ", \"humidity\": " + String(humidity) + "}";
    server.send(200, "application/json", jsonResponse);
  });

  // Start the HTTP server
  server.begin();

}



void loop() {
  // digitalWrite(ledPinB, HIGH);
  // if(!stop){
    // digitalWrite (25, HIGH); // set the LED on

    delay(3000);
    float tc = dht.readTemperature(false);  //Read temperature in C
    float tf = dht.readTemperature(true);   //Read Temperature in F
    float hu = dht.readHumidity();          //Read Humidity


    Serial.print("Temp: ");
    Serial.print(tc);
    Serial.print(" C, ");
    Serial.print(tf-10);
    Serial.print(" F, Hum: ");
    Serial.print(hu);
    Serial.println("%");


    stop = true;
  
  if(hu < 15){
    digitalWrite(ledPinR, HIGH);
  }else if(hu < 30){
    analogWrite(ledPinR, 128); // Turn on both LEDs at half intensity
    analogWrite(ledPinG, 128); // Turn on both LEDs at half intensity
  }else{
    analogWrite(ledPinG, 255);
  }
}
