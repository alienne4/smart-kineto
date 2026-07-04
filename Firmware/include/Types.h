#pragma once

#include <Arduino.h>
#include "AppConfig.h"

enum class SystemMode : uint8_t {
    Idle,
    Training,
    Exercise
};

enum class MotionDetectorState : uint8_t {
    Waiting,
    Capturing,
    Complete
};

enum class StreamMode : uint8_t {
    Off,
    Normal,
    Full
};

struct ImuSample {
    uint32_t timestampMs = 0;

    float ax = 0.0f;
    float ay = 0.0f;
    float az = 0.0f;

    float gx = 0.0f;
    float gy = 0.0f;
    float gz = 0.0f;

    float roll = 0.0f;
    float pitch = 0.0f;
    float temperatureC = 0.0f;
};

struct FeatureFrame {
    float roll = 0.0f;
    float pitch = 0.0f;
    float gx = 0.0f;
    float gy = 0.0f;
    float gz = 0.0f;
};

struct EvaluationResult {
    bool valid = false;

    float totalScore = 0.0f;
    float shapeScore = 0.0f;
    float durationScore = 0.0f;
    float durationRatio = 0.0f;

    float rollRmse = 0.0f;
    float pitchRmse = 0.0f;
    float gxRmse = 0.0f;
    float gyRmse = 0.0f;
    float gzRmse = 0.0f;

    uint32_t durationMs = 0;
};

struct StoredTemplate {
    uint32_t magic = 0;
    uint16_t version = 0;
    uint16_t templateSamples = 0;
    uint8_t featureCount = 0;
    uint8_t trainingRepetitions = 0;
    uint16_t reserved = 0;

    float averageDurationMs = 0.0f;
    float scoreThreshold = 0.0f;

    FeatureFrame frames[AppConfig::TEMPLATE_SAMPLES];

    uint32_t checksum = 0;
};
