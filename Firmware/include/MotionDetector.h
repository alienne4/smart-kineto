#pragma once

#include <Arduino.h>

#include "Types.h"

class MotionDetector {
public:
    MotionDetector();

    bool update(const ImuSample& sample);

    void reset();
    void cancel();

    MotionDetectorState state() const;
    const char* stateText() const;

    const ImuSample* samples() const;
    size_t sampleCount() const;

    uint32_t durationMs() const;

    // Nivelul filtrat folosit efectiv de detector
    float lastMotionLevel() const;

private:
    MotionDetectorState state_ =
        MotionDetectorState::Waiting;

    ImuSample captureBuffer_[
        AppConfig::MAX_CAPTURE_SAMPLES
    ];

    size_t captureCount_ = 0;

    ImuSample preTriggerBuffer_[
        AppConfig::PRE_TRIGGER_SAMPLES
    ];

    size_t preTriggerCount_ = 0;
    size_t preTriggerWriteIndex_ = 0;

    uint16_t startConfirmationCount_ = 0;
    uint16_t stopConfirmationCount_ = 0;

    uint32_t blockedUntilMs_ = 0;

    float rawMotionLevel_ = 0.0f;
    float filteredMotionLevel_ = 0.0f;
    float lastMotionLevel_ = 0.0f;

    void pushPreTrigger(
        const ImuSample& sample
    );

    void beginCapture();

    void appendSample(
        const ImuSample& sample
    );

    void completeCapture();

    static float calculateMotionLevel(
        const ImuSample& sample
    );

    static float applyDeadband(
        float value
    );
};