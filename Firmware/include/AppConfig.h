#pragma once

#include <Arduino.h>

namespace AppConfig {

// Hardware pins
constexpr uint8_t MPU_SDA_PIN = 4;
constexpr uint8_t MPU_SCL_PIN = 5;
constexpr uint8_t BUTTON_PIN = 41;
constexpr uint8_t LED_PIN = 42;

// Serial and sampling
constexpr uint32_t SERIAL_BAUD = 115200;
constexpr uint16_t SAMPLE_RATE_HZ = 50;
constexpr uint32_t SAMPLE_PERIOD_US = 1000000UL / SAMPLE_RATE_HZ;
constexpr uint32_t NORMAL_STREAM_INTERVAL_MS = 100;

// IMU configuration
constexpr uint32_t I2C_CLOCK_HZ = 100000;
constexpr uint16_t GYRO_CALIBRATION_SAMPLES = 250;
constexpr uint16_t GYRO_CALIBRATION_DELAY_MS = 4;
constexpr float COMPLEMENTARY_FILTER_ALPHA = 0.98f;

// Motion capture
// Detectarea unei miscari
constexpr size_t PRE_TRIGGER_SAMPLES = 8;
constexpr size_t MAX_CAPTURE_SAMPLES = 350;

// Cel putin 0.5 secunde la 50 Hz
constexpr size_t MIN_MOVEMENT_SAMPLES = 25;

// Miscarea trebuie sa depaseasca pragul timp de 100 ms
constexpr uint16_t START_CONFIRM_SAMPLES = 5;

// Consideram miscarea terminata dupa 400 ms de repaus relativ
constexpr uint16_t STOP_CONFIRM_SAMPLES = 20;

/*
 * Praguri cu histerezis:
 *
 * START este mai mare pentru a nu porni de la puls/tremur.
 * STOP este mai mic decat START, dar suficient de mare
 * pentru a considera respiratia si pulsul drept repaus.
 */
constexpr float START_MOTION_THRESHOLD_DPS = 10.0f;
constexpr float STOP_MOTION_THRESHOLD_DPS = 6.0f;

/*
 * Orice viteza sub 1.5 grade/secunda pe fiecare axa
 * este tratata ca zgomot si devine zero.
 */
constexpr float GYRO_DEADBAND_DPS = 1.5f;

/*
 * Filtru exponential pentru nivelul de miscare.
 * Valoare mai mare = filtrare mai puternica.
 */
constexpr float MOTION_FILTER_ALPHA = 0.78f;

constexpr uint32_t POST_MOVEMENT_COOLDOWN_MS = 500;

// Template and training
constexpr size_t TEMPLATE_SAMPLES = 100;
constexpr size_t FEATURE_COUNT = 5;
constexpr uint8_t DEFAULT_TRAINING_REPETITIONS = 3;
constexpr uint8_t MAX_TRAINING_REPETITIONS = 10;

// Validation
constexpr float DEFAULT_VALID_SCORE_THRESHOLD = 72.0f;
constexpr float MIN_DURATION_RATIO = 0.55f;
constexpr float MAX_DURATION_RATIO = 1.80f;
constexpr float ANGLE_ERROR_SCALE_DEG = 22.0f;
constexpr float GYRO_ERROR_SCALE_DPS = 95.0f;

// User interface
constexpr uint32_t BUTTON_DEBOUNCE_MS = 30;
constexpr uint32_t BUTTON_LONG_PRESS_MS = 1500;
constexpr uint32_t SENSOR_RETRY_INTERVAL_MS = 2000;
constexpr uint32_t SERIAL_WAIT_MS = 2500;

// Persistent storage
constexpr uint32_t TEMPLATE_MAGIC = 0x52484231;  // "RHB1"
constexpr uint16_t TEMPLATE_VERSION = 1;
constexpr const char* PREFERENCES_NAMESPACE = "rehabfw";
constexpr const char* TEMPLATE_KEY = "template";

// BLE (see Firmware/README.md for the packet layout shared with the app/web clients)
constexpr const char* BLE_DEVICE_NAME = "SmartKineto Wand";
constexpr const char* BLE_SERVICE_UUID = "3f14498e-fd41-4682-8056-1e15ff36adfa";
constexpr const char* BLE_IMU_CHAR_UUID = "158796bd-587e-425c-b161-43d08aa320dc";
constexpr const char* BLE_CONTROL_CHAR_UUID = "47584c68-23f8-4a64-bdca-b18c8d3698bf";
constexpr uint8_t BLE_CMD_CALIBRATE = 0x01;

}  // namespace AppConfig
