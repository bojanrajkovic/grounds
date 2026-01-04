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
// The field names act as discriminants - "temperature" vs "humidity"
const TemperatureDataSchema = RStruct({
  temperature: field(0, RF32()), // Celsius
});

const HumidityDataSchema = RStruct({
  humidity: field(0, RF32()), // Percentage (0-100)
});

// Create an enum for the sensor data variants
// Each variant has a unique ID for wire format and a unique structure
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
type SensorReading = Static<typeof SensorReadingSchema>;

// Create codec for encoding/decoding
const codec = createCodec(SensorReadingSchema);

// Create some sensor readings
const tempReading: SensorReading = {
  sensorId: "sensor-001",
  timestamp: DateTime.now(),
  data: { temperature: 23.5 },
};

const humidityReading: SensorReading = {
  sensorId: "sensor-002",
  timestamp: DateTime.now(),
  data: { humidity: 65.2 },
};

// Helper to identify sensor type from decoded data
function getSensorType(data: TemperatureData | HumidityData): string {
  if ("temperature" in data) {
    return "temperature";
  }
  if ("humidity" in data) {
    return "humidity";
  }
  return "unknown";
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
    (decoded) => {
      console.log("Sensor ID:", decoded.sensorId);
      console.log("Type:", getSensorType(decoded.data));
      if ("temperature" in decoded.data) {
        console.log("Temperature:", decoded.data.temperature, "°C");
      }
    },
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
    (decoded) => {
      console.log("Sensor ID:", decoded.sensorId);
      console.log("Type:", getSensorType(decoded.data));
      if ("humidity" in decoded.data) {
        console.log("Humidity:", decoded.data.humidity, "%");
      }
    },
    (err) => console.error("Failed:", err.message),
  );
