#pragma once

#include <Arduino.h>

#include "Types.h"

class ExerciseTemplate {
public:
    ExerciseTemplate();

    void clear();

    void beginTraining(uint8_t targetRepetitions);
    void cancelTraining();
    bool addTrainingMovement(const ImuSample* samples, size_t count);

    bool isTrainingActive() const;
    bool isTrainingComplete() const;
    uint8_t trainingTarget() const;
    uint8_t trainingCollected() const;

    bool hasTemplate() const;
    float averageDurationMs() const;
    uint8_t templateTrainingRepetitions() const;

    EvaluationResult evaluate(const ImuSample* samples, size_t count) const;

    float scoreThreshold() const;
    void setScoreThreshold(float threshold);

    bool exportData(StoredTemplate& output) const;
    bool importData(const StoredTemplate& input);

private:
    bool hasTemplate_ = false;
    bool trainingActive_ = false;
    bool trainingComplete_ = false;

    uint8_t trainingTarget_ = 0;
    uint8_t trainingCollected_ = 0;
    uint8_t templateTrainingRepetitions_ = 0;

    float averageDurationMs_ = 0.0f;
    float trainingDurationSumMs_ = 0.0f;
    float scoreThreshold_ = AppConfig::DEFAULT_VALID_SCORE_THRESHOLD;

    FeatureFrame templateFrames_[AppConfig::TEMPLATE_SAMPLES];
    float trainingSum_[AppConfig::TEMPLATE_SAMPLES][AppConfig::FEATURE_COUNT];

    static bool resampleAndNormalize(const ImuSample* samples,
                                     size_t count,
                                     FeatureFrame* output);
    static float angleDifference(float angle, float reference);
    static uint32_t movementDurationMs(const ImuSample* samples, size_t count);
};
