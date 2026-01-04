// pattern: Imperative Shell
// Demonstrates: Using enums with discriminant fields for sensor data

import {
  RStruct,
  REnum,
  RString,
  RF32,
  RTimestamp,
  field,
  variant,
  createCodec,
} from "@grounds/schema";
import type { Static } from "@sinclair/typebox";
import { DateTime } from "luxon";

// Define different data payloads for each sensor type
// Each variant includes a sensorType field for explicit discrimination
// The unique value fields (temperature vs humidity) allow schema matching
const TemperatureDataSchema = RStruct({
  sensorType: field(0, RString()), // "temperature"
  temperature: field(1, RF32()), // Celsius
});

const HumidityDataSchema = RStruct({
  sensorType: field(0, RString()), // "humidity"
  humidity: field(1, RF32()), // Percentage (0-100)
});

// Create an enum for the sensor data variants
// The schema system matches variants by structure (temperature vs humidity field)
// The sensorType field provides explicit runtime discrimination after decoding
const SensorDataSchema = REnum({
  temperature: variant(0, TemperatureDataSchema),
  humidity: variant(1, HumidityDataSchema),
});

// The full sensor reading wraps common fields + variant data
const SensorReadingSchema = RStruct({
  sensorId: field(0, RString()),
  timestamp: field(1, RTimestamp()),
  data: field(2, SensorDataSchema),
});

// Extract types for use in application code
type TemperatureData = Static<typeof TemperatureDataSchema>;
type HumidityData = Static<typeof HumidityDataSchema>;
type SensorData = TemperatureData | HumidityData;
type SensorReading = Static<typeof SensorReadingSchema>;

// Create codec for encoding/decoding
const codec = createCodec(SensorReadingSchema);

// Create some sensor readings
const tempReading: SensorReading = {
  sensorId: "sensor-001",
  timestamp: DateTime.now(),
  data: { sensorType: "temperature", temperature: 23.5 },
};

const humidityReading: SensorReading = {
  sensorId: "sensor-002",
  timestamp: DateTime.now(),
  data: { sensorType: "humidity", humidity: 65.2 },
};

// Type guard using the sensorType discriminant field
function isTemperatureData(data: SensorData): data is TemperatureData {
  return data.sensorType === "temperature";
}

function isHumidityData(data: SensorData): data is HumidityData {
  return data.sensorType === "humidity";
}

// Process a decoded sensor reading using the discriminant field
function processSensorReading(reading: SensorReading): void {
  console.log("Sensor ID:", reading.sensorId);
  console.log("Sensor Type:", reading.data.sensorType);

  if (isTemperatureData(reading.data)) {
    console.log("Temperature:", reading.data.temperature, "°C");
  } else if (isHumidityData(reading.data)) {
    console.log("Humidity:", reading.data.humidity, "%");
  }
}

// Encode and decode temperature reading
console.log("=== Temperature Sensor ===");
codec
  .encode(tempReading)
  .andThen((bytes) => {
    console.log("Encoded:", bytes.length, "bytes");
    return codec.decode(bytes);
  })
  .match(
    (decoded) => processSensorReading(decoded),
    (err) => console.error("Failed:", err.message),
  );

// Encode and decode humidity reading
console.log("\n=== Humidity Sensor ===");
codec
  .encode(humidityReading)
  .andThen((bytes) => {
    console.log("Encoded:", bytes.length, "bytes");
    return codec.decode(bytes);
  })
  .match(
    (decoded) => processSensorReading(decoded),
    (err) => console.error("Failed:", err.message),
  );
