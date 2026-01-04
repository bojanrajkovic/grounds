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
// Each variant has a unique field name for schema matching
const TemperatureDataSchema = RStruct({
  temperature: field(0, RF32()), // Celsius
});

const HumidityDataSchema = RStruct({
  humidity: field(0, RF32()), // Percentage (0-100)
});

// Create an enum for the sensor data variants
const SensorDataSchema = REnum({
  temperature: variant(0, TemperatureDataSchema),
  humidity: variant(1, HumidityDataSchema),
});

// The full sensor reading has sensorType at the top level for discrimination
const SensorReadingSchema = RStruct({
  sensorId: field(0, RString()),
  sensorType: field(1, RString()), // "temperature" or "humidity"
  timestamp: field(2, RTimestamp()),
  data: field(3, SensorDataSchema),
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
  sensorType: "temperature",
  timestamp: DateTime.now(),
  data: { temperature: 23.5 },
};

const humidityReading: SensorReading = {
  sensorId: "sensor-002",
  sensorType: "humidity",
  timestamp: DateTime.now(),
  data: { humidity: 65.2 },
};

// Type guard using the top-level sensorType discriminant field
function isTemperatureReading(
  reading: SensorReading,
): reading is SensorReading & { data: TemperatureData } {
  return reading.sensorType === "temperature";
}

function isHumidityReading(
  reading: SensorReading,
): reading is SensorReading & { data: HumidityData } {
  return reading.sensorType === "humidity";
}

// Process a decoded sensor reading using the discriminant field
function processSensorReading(reading: SensorReading): void {
  console.log("Sensor ID:", reading.sensorId);
  console.log("Sensor Type:", reading.sensorType);

  if (isTemperatureReading(reading)) {
    console.log("Temperature:", reading.data.temperature, "°C");
  } else if (isHumidityReading(reading)) {
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
