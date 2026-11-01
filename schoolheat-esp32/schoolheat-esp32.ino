#include <Arduino.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <LittleFS.h>
#include <Preferences.h>
#include <WebServer.h>
#include <WiFi.h>
#include <stdlib.h>
#include <sys/time.h>
#include <time.h>

const char *AP_SSID = "SchoolHeat";
const char *AP_PASSWORD = "TUKLAS2026";
const char *APP_ORIGIN = "https://johannejumamoy11-rgb.github.io";

constexpr uint8_t DHT_PIN = 4;
constexpr uint8_t DHT_TYPE = DHT22;
constexpr uint32_t SAMPLE_INTERVAL_MS = 5UL * 60UL * 1000UL;
constexpr size_t MAX_LOG_BYTES = 192UL * 1024UL;
constexpr size_t ROTATE_HEADROOM_BYTES = 16UL * 1024UL;
constexpr char LOG_PATH[] = "/readings.jsonl";
constexpr char TEMP_PATH[] = "/readings.tmp";
constexpr char BACKUP_PATH[] = "/readings.bak";

DHT dht(DHT_PIN, DHT_TYPE);
WebServer server(80);
Preferences prefs;
String deviceId;
String bootId;
String sensorLocation;
uint64_t nextSequence = 1;
uint32_t lastSampleAt = 0;
uint32_t sensorErrors = 0;
uint32_t timeAnchorUptime = 0;
int64_t timeAnchorEpochMs = 0;
bool timeIsSet = false;
bool storageReady = false;
bool storageFull = false;
uint32_t droppedReadings = 0;

void addCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", APP_ORIGIN);
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Private-Network", "true");
  server.sendHeader("Cache-Control", "no-store");
}

void sendJson(int statusCode, const String &body) {
  addCorsHeaders();
  server.send(statusCode, "application/json", body);
}

String makeUtcTimestamp(int64_t epochMs) {
  const time_t seconds = static_cast<time_t>(epochMs / 1000);
  struct tm utc {};
  if (gmtime_r(&seconds, &utc) == nullptr) return "";
  char text[25];
  if (strftime(text, sizeof(text), "%Y-%m-%dT%H:%M:%SZ", &utc) == 0) return "";
  return String(text);
}

String getTimestampForUptime(uint32_t uptimeMs) {
  if (!timeIsSet) return "";
  const int32_t elapsed = static_cast<int32_t>(uptimeMs - timeAnchorUptime);
  return makeUtcTimestamp(timeAnchorEpochMs + elapsed);
}

uint64_t readLastSequence() {
  uint64_t highest = 0;
  File file = LittleFS.open(LOG_PATH, FILE_READ);
  if (!file) return highest;
  while (file.available()) {
    String line = file.readStringUntil('\n');
    DynamicJsonDocument doc(512);
    if (deserializeJson(doc, line) == DeserializationError::Ok) {
      const uint64_t sequence = doc["sequence"].as<uint64_t>();
      if (sequence > highest) highest = sequence;
    }
  }
  file.close();
  return highest;
}

bool rewriteLog(bool stampCurrentBoot, bool dropOldest = false) {
  File input = LittleFS.open(LOG_PATH, FILE_READ);
  File output = LittleFS.open(TEMP_PATH, FILE_WRITE);
  if (!output) {
    if (input) input.close();
    return false;
  }

  bool ok = true;
  uint32_t removedReadings = 0;
  if (input) {
    size_t remainingInputBytes = input.size();
    while (input.available()) {
      String line = input.readStringUntil('\n');
      DynamicJsonDocument doc(768);
      if (deserializeJson(doc, line) != DeserializationError::Ok) {
        ok = false;
        break;
      }

      const size_t lineBytes = line.length() + 1;
      remainingInputBytes = remainingInputBytes >= lineBytes
          ? remainingInputBytes - lineBytes
          : 0;
      if (dropOldest && remainingInputBytes > MAX_LOG_BYTES - ROTATE_HEADROOM_BYTES) {
        ++removedReadings;
        continue;
      }

      if (stampCurrentBoot &&
          String(doc["bootId"] | "") == bootId &&
          String(doc["timestamp"] | "").isEmpty()) {
        const uint32_t uptime = doc["uptimeMs"] | 0UL;
        const String timestamp = getTimestampForUptime(uptime);
        if (!timestamp.isEmpty()) doc["timestamp"] = timestamp;
      }
      if (String(doc["location"] | "").isEmpty() && !sensorLocation.isEmpty()) {
        doc["location"] = sensorLocation;
      }

      if (serializeJson(doc, output) == 0 || output.print('\n') != 1) {
        ok = false;
        break;
      }
    }
    input.close();
  }
  if (dropOldest && removedReadings == 0) ok = false;
  output.flush();
  output.close();
  if (!ok) {
    LittleFS.remove(TEMP_PATH);
    return false;
  }

  LittleFS.remove(BACKUP_PATH);
  const bool hadOriginal = LittleFS.exists(LOG_PATH);
  if (hadOriginal && !LittleFS.rename(LOG_PATH, BACKUP_PATH)) {
    LittleFS.remove(TEMP_PATH);
    return false;
  }
  if (!LittleFS.rename(TEMP_PATH, LOG_PATH)) {
    if (hadOriginal) LittleFS.rename(BACKUP_PATH, LOG_PATH);
    LittleFS.remove(TEMP_PATH);
    return false;
  }
  LittleFS.remove(BACKUP_PATH);
  File updated = LittleFS.open(LOG_PATH, FILE_READ);
  storageFull = updated && updated.size() >= MAX_LOG_BYTES;
  if (updated) updated.close();
  droppedReadings += removedReadings;
  return true;
}

void handleOptions() {
  addCorsHeaders();
  server.send(204);
}

void handleStatus() {
  uint32_t pending = 0;
  File file = LittleFS.open(LOG_PATH, FILE_READ);
  if (file) {
    while (file.available()) {
      file.readStringUntil('\n');
      ++pending;
    }
    file.close();
  }

  DynamicJsonDocument doc(512);
  doc["deviceId"] = deviceId;
  doc["sensor"] = "DHT22";
  doc["location"] = sensorLocation;
  doc["sampleIntervalSeconds"] = SAMPLE_INTERVAL_MS / 1000;
  doc["clockSynced"] = timeIsSet;
  doc["storageReady"] = storageReady;
  doc["storageFull"] = storageFull;
  doc["pendingReadings"] = pending;
  doc["droppedReadingsSinceBoot"] = droppedReadings;
  doc["sensorErrors"] = sensorErrors;
  String body;
  serializeJson(doc, body);
  sendJson(200, body);
}

void handleReadings() {
  if (!storageReady) {
    sendJson(503, "{\"error\":\"ESP32 flash storage is unavailable.\"}");
    return;
  }

  DynamicJsonDocument response(24576);
  response["deviceId"] = deviceId;
  JsonArray records = response.createNestedArray("readings");
  uint32_t untimestamped = 0;
  const uint64_t afterSequence = strtoull(server.arg("after").c_str(), nullptr, 10);
  uint64_t cursor = afterSequence;
  File file = LittleFS.open(LOG_PATH, FILE_READ);
  if (file) {
    while (file.available() && records.size() < 100) {
      String line = file.readStringUntil('\n');
      DynamicJsonDocument record(768);
      if (deserializeJson(record, line) != DeserializationError::Ok) {
        file.close();
        sendJson(500, "{\"error\":\"Stored log contains an unreadable record.\"}");
        return;
      }
      const uint64_t sequence = record["sequence"].as<uint64_t>();
      cursor = sequence;
      if (sequence <= afterSequence) continue;
      if (String(record["timestamp"] | "").isEmpty()) {
        ++untimestamped;
        continue;
      }
      JsonObject copy = records.createNestedObject();
      copy["sequence"] = record["sequence"];
      copy["temperature"] = record["temperature"];
      copy["humidity"] = record["humidity"];
      copy["timestamp"] = record["timestamp"];
      copy["location"] = record["location"];
      copy["bootId"] = record["bootId"];
      copy["uptimeMs"] = record["uptimeMs"];
    }
    file.close();
  }
  response["untimestampedReadings"] = untimestamped;
  response["cursor"] = cursor;
  String body;
  serializeJson(response, body);
  sendJson(200, body);
}

void handleTime() {
  DynamicJsonDocument request(256);
  if (deserializeJson(request, server.arg("plain")) != DeserializationError::Ok) {
    sendJson(400, "{\"error\":\"Invalid JSON request.\"}");
    return;
  }
  const int64_t epochMs = request["epochMs"].as<int64_t>();
  if (epochMs < 1700000000000LL || epochMs > 4102444800000LL) {
    sendJson(400, "{\"error\":\"The supplied clock value is invalid.\"}");
    return;
  }

  timeAnchorUptime = millis();
  timeAnchorEpochMs = epochMs;
  struct timeval tv {};
  tv.tv_sec = static_cast<time_t>(epochMs / 1000);
  tv.tv_usec = static_cast<suseconds_t>((epochMs % 1000) * 1000);
  if (settimeofday(&tv, nullptr) != 0) {
    sendJson(500, "{\"error\":\"Could not set the ESP32 clock.\"}");
    return;
  }
  timeIsSet = true;
  if (!rewriteLog(true)) {
    sendJson(500, "{\"error\":\"Clock set, but stored timestamps could not be updated.\"}");
    return;
  }
  sendJson(200, "{\"clockSynced\":true}");
}

void handleLocation() {
  DynamicJsonDocument request(512);
  if (deserializeJson(request, server.arg("plain")) != DeserializationError::Ok) {
    sendJson(400, "{\"error\":\"Invalid JSON request.\"}");
    return;
  }
  const String location = request["location"] | "";
  if (location.isEmpty() || location.length() > 120) {
    sendJson(400, "{\"error\":\"Select a valid SchoolHeat location.\"}");
    return;
  }
  if (location == sensorLocation) {
    sendJson(200, "{\"locationSaved\":true}");
    return;
  }
  const String previousLocation = sensorLocation;
  sensorLocation = location;
  if (!rewriteLog(false)) {
    sensorLocation = previousLocation;
    sendJson(500, "{\"error\":\"Location saved, but stored readings could not be updated.\"}");
    return;
  }
  if (prefs.putString("location", sensorLocation) == 0) {
    sendJson(500, "{\"error\":\"Readings were updated, but the sensor location could not be saved.\"}");
    return;
  }
  sendJson(200, "{\"locationSaved\":true}");
}

bool recordSensorSample() {
  if (sensorLocation.isEmpty()) {
    Serial.println("Choose a SchoolHeat location from the app before logging readings.");
    return false;
  }
  const float temperature = dht.readTemperature();
  const float humidity = dht.readHumidity();
  if (!isfinite(temperature) || !isfinite(humidity) ||
      temperature < 0 || temperature > 60 || humidity < 0 || humidity > 100) {
    ++sensorErrors;
    Serial.println("DHT22 sample invalid; not saved.");
    return false;
  }
  if (!storageReady) {
    Serial.println("Flash storage unavailable; sample not saved.");
    return false;
  }

  const uint32_t uptime = millis();
  DynamicJsonDocument doc(512);
  doc["sequence"] = nextSequence;
  doc["deviceId"] = deviceId;
  doc["bootId"] = bootId;
  doc["uptimeMs"] = uptime;
  doc["timestamp"] = getTimestampForUptime(uptime);
  doc["location"] = sensorLocation;
  doc["temperature"] = roundf(temperature * 10) / 10;
  doc["humidity"] = roundf(humidity * 10) / 10;
  String line;
  serializeJson(doc, line);

  File current = LittleFS.open(LOG_PATH, FILE_READ);
  size_t currentSize = current ? current.size() : 0;
  if (current) current.close();
  while (currentSize + line.length() + 1 > MAX_LOG_BYTES) {
    if (!rewriteLog(false, true)) {
      storageFull = true;
      Serial.println("Flash log is full and its oldest reading could not be removed.");
      return false;
    }
    current = LittleFS.open(LOG_PATH, FILE_READ);
    currentSize = current ? current.size() : 0;
    if (current) current.close();
  }
  File file = LittleFS.open(LOG_PATH, FILE_APPEND);
  if (!file) return false;
  const bool saved = file.print(line) == line.length() && file.print('\n') == 1;
  file.flush();
  file.close();
  if (!saved) {
    Serial.println("Flash write failed; sample was not confirmed.");
    return false;
  }
  ++nextSequence;
  storageFull = false;
  Serial.printf("Saved #%llu: %.1f C, %.1f%% RH%s\n",
                static_cast<unsigned long long>(nextSequence - 1),
                temperature, humidity, timeIsSet ? "" : " (time pending)");
  return true;
}

void handleSample() {
  if (!storageReady) {
    sendJson(503, "{\"error\":\"ESP32 flash storage is unavailable.\"}");
    return;
  }
  lastSampleAt = millis();
  if (!recordSensorSample()) {
    sendJson(503, "{\"error\":\"DHT22 sample could not be saved. Check the sensor, location, and ESP32 storage.\"}");
    return;
  }
  sendJson(200, "{\"sampleSaved\":true}");
}

bool startAccessPoint() {
  if (String(AP_PASSWORD).startsWith("CHANGE_ME") ||
      String(AP_PASSWORD).length() < 8) {
    Serial.println("ERROR: Set AP_PASSWORD to a private value of at least 8 characters.");
    return false;
  }
  WiFi.mode(WIFI_AP);
  if (!WiFi.softAP(AP_SSID, AP_PASSWORD)) {
    Serial.println("ERROR: Could not start the SchoolHeat Wi-Fi access point.");
    return false;
  }

  Serial.println();
  Serial.println("SchoolHeat Wi-Fi access point started.");
  Serial.print("Wi-Fi name: ");
  Serial.println(AP_SSID);
  Serial.println("Use the private AP_PASSWORD configured in the sketch.");
  Serial.print("ESP32 API address: http://");
  Serial.println(WiFi.softAPIP());
  return true;
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  deviceId = String(static_cast<uint32_t>(ESP.getEfuseMac()), HEX);
  bootId = String(esp_random(), HEX);
  Serial.println("Mounting LittleFS; it will be formatted automatically if mounting fails.");
  storageReady = LittleFS.begin(true);
  if (!storageReady) {
    Serial.println("LittleFS mount/format failed. Readings cannot be stored.");
  } else {
    Serial.println("LittleFS mounted successfully.");
  }
  if (storageReady) {
    nextSequence = readLastSequence() + 1;
    File logFile = LittleFS.open(LOG_PATH, FILE_READ);
    storageFull = logFile && logFile.size() >= MAX_LOG_BYTES;
    if (logFile) logFile.close();
  }

  server.on("/api/status", HTTP_GET, handleStatus);
  server.on("/api/readings", HTTP_GET, handleReadings);
  server.on("/api/time", HTTP_POST, handleTime);
  server.on("/api/location", HTTP_POST, handleLocation);
  server.on("/api/sample", HTTP_POST, handleSample);
  server.on("/api/status", HTTP_OPTIONS, handleOptions);
  server.on("/api/readings", HTTP_OPTIONS, handleOptions);
  server.on("/api/time", HTTP_OPTIONS, handleOptions);
  server.on("/api/location", HTTP_OPTIONS, handleOptions);
  server.on("/api/sample", HTTP_OPTIONS, handleOptions);

  prefs.begin("schoolheat", false);
  sensorLocation = prefs.getString("location", "");
  if (!startAccessPoint()) {
    Serial.println("Fix AP_PASSWORD, then restart the ESP32.");
    while (true) delay(1000);
  }
  server.begin();
  Serial.println("SchoolHeat API server started.");
  recordSensorSample();
  lastSampleAt = millis();
}

void loop() {
  server.handleClient();
  if (millis() - lastSampleAt >= SAMPLE_INTERVAL_MS) {
    lastSampleAt = millis();
    recordSensorSample();
  }
}
