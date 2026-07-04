#include "ImuManager.h"

#include <cmath>

#include "AppConfig.h"
#include "Logger.h"

bool ImuManager::begin() {
    ready_ = false;
    orientationInitialized_ = false;

    Logger::info("Pornire magistrala I2C: SDA=GPIO %u, SCL=GPIO %u",
                 AppConfig::MPU_SDA_PIN,
                 AppConfig::MPU_SCL_PIN);

    Wire.begin(AppConfig::MPU_SDA_PIN, AppConfig::MPU_SCL_PIN);
    Wire.setClock(AppConfig::I2C_CLOCK_HZ);
    delay(100);

    if (!waitForDevice()) {
        Logger::error("MPU6050 nu a fost gasit la adresa 0x68.");
        return false;
    }

    mpu_.initialize();
    mpu_.setFullScaleAccelRange(MPU6050_ACCEL_FS_4);
    mpu_.setFullScaleGyroRange(MPU6050_GYRO_FS_500);

    if (!mpu_.testConnection()) {
        Logger::error("MPU6050 a raspuns la scanare, dar testConnection() a esuat.");
        return false;
    }

    Logger::info("MPU6050 conectat cu succes la adresa 0x68.");

    if (!calibrateGyroscope()) {
        Logger::error("Calibrarea giroscopului a esuat.");
        return false;
    }

    initializeOrientation();
    lastUpdateMicros_ = micros();
    ready_ = true;

    Logger::info("IMU pregatit. Accelerometru=+/-4g, giroscop=+/-500 deg/s.");
    return true;
}

bool ImuManager::waitForDevice() {
    for (uint8_t attempt = 1; attempt <= 12; ++attempt) {
        Wire.beginTransmission(0x68);
        const uint8_t result = Wire.endTransmission();

        if (result == 0) {
            Logger::info("Dispozitiv I2C detectat la 0x68 dupa incercarea %u.", attempt);
            return true;
        }

        Logger::warning("MPU6050 nu raspunde. Incercarea %u/12, cod I2C=%u.",
                        attempt,
                        result);
        delay(250);
    }

    return false;
}

bool ImuManager::calibrateGyroscope() {
    Logger::info("Calibrare giroscop: tine aparatul complet nemiscat aproximativ o secunda.");

    int64_t sumX = 0;
    int64_t sumY = 0;
    int64_t sumZ = 0;

    for (uint16_t i = 0; i < AppConfig::GYRO_CALIBRATION_SAMPLES; ++i) {
        int16_t gx = 0;
        int16_t gy = 0;
        int16_t gz = 0;

        mpu_.getRotation(&gx, &gy, &gz);

        sumX += gx;
        sumY += gy;
        sumZ += gz;

        delay(AppConfig::GYRO_CALIBRATION_DELAY_MS);
    }

    constexpr float gyroScale = 65.5f;
    gyroBiasX_ = static_cast<float>(sumX) /
                 static_cast<float>(AppConfig::GYRO_CALIBRATION_SAMPLES) /
                 gyroScale;
    gyroBiasY_ = static_cast<float>(sumY) /
                 static_cast<float>(AppConfig::GYRO_CALIBRATION_SAMPLES) /
                 gyroScale;
    gyroBiasZ_ = static_cast<float>(sumZ) /
                 static_cast<float>(AppConfig::GYRO_CALIBRATION_SAMPLES) /
                 gyroScale;

    Logger::info("Bias giroscop: X=%.3f, Y=%.3f, Z=%.3f deg/s",
                 gyroBiasX_,
                 gyroBiasY_,
                 gyroBiasZ_);

    return true;
}

void ImuManager::initializeOrientation() {
    int16_t ax = 0;
    int16_t ay = 0;
    int16_t az = 0;

    mpu_.getAcceleration(&ax, &ay, &az);

    constexpr float accelScale = 8192.0f;
    const float accelX = static_cast<float>(ax) / accelScale;
    const float accelY = static_cast<float>(ay) / accelScale;
    const float accelZ = static_cast<float>(az) / accelScale;

    roll_ = atan2f(accelY, accelZ) * RAD_TO_DEG;
    pitch_ = atan2f(-accelX, sqrtf(accelY * accelY + accelZ * accelZ)) * RAD_TO_DEG;
    orientationInitialized_ = true;

    Logger::info("Orientare initiala: roll=%.2f deg, pitch=%.2f deg", roll_, pitch_);
}

bool ImuManager::readSample(ImuSample& sample) {
    if (!ready_) {
        return false;
    }

    int16_t axRaw = 0;
    int16_t ayRaw = 0;
    int16_t azRaw = 0;
    int16_t gxRaw = 0;
    int16_t gyRaw = 0;
    int16_t gzRaw = 0;

    mpu_.getMotion6(&axRaw, &ayRaw, &azRaw, &gxRaw, &gyRaw, &gzRaw);

    constexpr float accelScale = 8192.0f;
    constexpr float gyroScale = 65.5f;

    sample.ax = static_cast<float>(axRaw) / accelScale;
    sample.ay = static_cast<float>(ayRaw) / accelScale;
    sample.az = static_cast<float>(azRaw) / accelScale;

    sample.gx = static_cast<float>(gxRaw) / gyroScale - gyroBiasX_;
    sample.gy = static_cast<float>(gyRaw) / gyroScale - gyroBiasY_;
    sample.gz = static_cast<float>(gzRaw) / gyroScale - gyroBiasZ_;

    const uint32_t nowMicros = micros();
    float deltaTime = static_cast<float>(nowMicros - lastUpdateMicros_) / 1000000.0f;
    lastUpdateMicros_ = nowMicros;

    if (deltaTime <= 0.0f || deltaTime > 0.10f) {
        deltaTime = 1.0f / static_cast<float>(AppConfig::SAMPLE_RATE_HZ);
    }

    const float accelerometerRoll = atan2f(sample.ay, sample.az) * RAD_TO_DEG;
    const float accelerometerPitch =
        atan2f(-sample.ax, sqrtf(sample.ay * sample.ay + sample.az * sample.az)) * RAD_TO_DEG;

    if (!orientationInitialized_) {
        roll_ = accelerometerRoll;
        pitch_ = accelerometerPitch;
        orientationInitialized_ = true;
    } else {
        const float alpha = AppConfig::COMPLEMENTARY_FILTER_ALPHA;

        roll_ = alpha * (roll_ + sample.gx * deltaTime) +
                (1.0f - alpha) * accelerometerRoll;
        pitch_ = alpha * (pitch_ + sample.gy * deltaTime) +
                 (1.0f - alpha) * accelerometerPitch;
    }

    sample.roll = roll_;
    sample.pitch = pitch_;
    sample.timestampMs = millis();

    const int16_t temperatureRaw = mpu_.getTemperature();
    sample.temperatureC = static_cast<float>(temperatureRaw) / 340.0f + 36.53f;

    return true;
}

bool ImuManager::recalibrateGyroscope() {
    if (!ready_) {
        return false;
    }

    const bool success = calibrateGyroscope();
    if (success) {
        initializeOrientation();
        lastUpdateMicros_ = micros();
    }
    return success;
}

bool ImuManager::isReady() const {
    return ready_;
}

float ImuManager::motionLevel(const ImuSample& sample) const {
    return sqrtf(sample.gx * sample.gx +
                 sample.gy * sample.gy +
                 sample.gz * sample.gz);
}
