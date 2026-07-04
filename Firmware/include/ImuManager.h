#pragma once

#include <Arduino.h>
#include <MPU6050.h>
#include <Wire.h>

#include "Types.h"

class ImuManager {
public:
    bool begin();
    bool readSample(ImuSample& sample);
    bool recalibrateGyroscope();

    bool isReady() const;
    float motionLevel(const ImuSample& sample) const;

private:
    MPU6050 mpu_;

    bool ready_ = false;
    bool orientationInitialized_ = false;

    float gyroBiasX_ = 0.0f;
    float gyroBiasY_ = 0.0f;
    float gyroBiasZ_ = 0.0f;

    float roll_ = 0.0f;
    float pitch_ = 0.0f;

    uint32_t lastUpdateMicros_ = 0;

    bool waitForDevice();
    bool calibrateGyroscope();
    void initializeOrientation();
};
