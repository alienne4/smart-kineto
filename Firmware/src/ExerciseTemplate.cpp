#include "ExerciseTemplate.h"

#include <cmath>
#include <cstring>

#include "AppConfig.h"
#include "Logger.h"

ExerciseTemplate::ExerciseTemplate() {
    clear();
}

void ExerciseTemplate::clear() {
    hasTemplate_ = false;
    trainingActive_ = false;
    trainingComplete_ = false;
    trainingTarget_ = 0;
    trainingCollected_ = 0;
    templateTrainingRepetitions_ = 0;
    averageDurationMs_ = 0.0f;
    trainingDurationSumMs_ = 0.0f;
    scoreThreshold_ = AppConfig::DEFAULT_VALID_SCORE_THRESHOLD;

    memset(templateFrames_, 0, sizeof(templateFrames_));
    memset(trainingSum_, 0, sizeof(trainingSum_));
}

void ExerciseTemplate::beginTraining(uint8_t targetRepetitions) {
    if (targetRepetitions < 1) {
        targetRepetitions = 1;
    }
    if (targetRepetitions > AppConfig::MAX_TRAINING_REPETITIONS) {
        targetRepetitions = AppConfig::MAX_TRAINING_REPETITIONS;
    }

    trainingActive_ = true;
    trainingComplete_ = false;
    trainingTarget_ = targetRepetitions;
    trainingCollected_ = 0;
    trainingDurationSumMs_ = 0.0f;
    memset(trainingSum_, 0, sizeof(trainingSum_));

    Logger::info("Antrenare inceputa. Sunt necesare %u repetari corecte ale terapeutului.",
                 trainingTarget_);
}

void ExerciseTemplate::cancelTraining() {
    trainingActive_ = false;
    trainingComplete_ = false;
    trainingTarget_ = 0;
    trainingCollected_ = 0;
    trainingDurationSumMs_ = 0.0f;
    memset(trainingSum_, 0, sizeof(trainingSum_));

    Logger::warning("Antrenarea curenta a fost anulata. Template-ul vechi ramane disponibil.");
}

bool ExerciseTemplate::addTrainingMovement(const ImuSample* samples, size_t count) {
    if (!trainingActive_ || samples == nullptr || count < 2) {
        return false;
    }

    FeatureFrame normalized[AppConfig::TEMPLATE_SAMPLES];
    if (!resampleAndNormalize(samples, count, normalized)) {
        return false;
    }

    for (size_t i = 0; i < AppConfig::TEMPLATE_SAMPLES; ++i) {
        trainingSum_[i][0] += normalized[i].roll;
        trainingSum_[i][1] += normalized[i].pitch;
        trainingSum_[i][2] += normalized[i].gx;
        trainingSum_[i][3] += normalized[i].gy;
        trainingSum_[i][4] += normalized[i].gz;
    }

    trainingDurationSumMs_ += static_cast<float>(movementDurationMs(samples, count));
    ++trainingCollected_;

    Logger::info("Repetare terapeut memorata: %u/%u",
                 trainingCollected_,
                 trainingTarget_);

    if (trainingCollected_ < trainingTarget_) {
        return true;
    }

    const float divisor = static_cast<float>(trainingCollected_);

    for (size_t i = 0; i < AppConfig::TEMPLATE_SAMPLES; ++i) {
        templateFrames_[i].roll = trainingSum_[i][0] / divisor;
        templateFrames_[i].pitch = trainingSum_[i][1] / divisor;
        templateFrames_[i].gx = trainingSum_[i][2] / divisor;
        templateFrames_[i].gy = trainingSum_[i][3] / divisor;
        templateFrames_[i].gz = trainingSum_[i][4] / divisor;
    }

    averageDurationMs_ = trainingDurationSumMs_ / divisor;
    templateTrainingRepetitions_ = trainingCollected_;
    hasTemplate_ = true;
    trainingActive_ = false;
    trainingComplete_ = true;

    Logger::info("Template creat cu succes. Durata medie=%.0f ms.",
                 averageDurationMs_);

    return true;
}

bool ExerciseTemplate::isTrainingActive() const {
    return trainingActive_;
}

bool ExerciseTemplate::isTrainingComplete() const {
    return trainingComplete_;
}

uint8_t ExerciseTemplate::trainingTarget() const {
    return trainingTarget_;
}

uint8_t ExerciseTemplate::trainingCollected() const {
    return trainingCollected_;
}

bool ExerciseTemplate::hasTemplate() const {
    return hasTemplate_;
}

float ExerciseTemplate::averageDurationMs() const {
    return averageDurationMs_;
}

uint8_t ExerciseTemplate::templateTrainingRepetitions() const {
    return templateTrainingRepetitions_;
}

EvaluationResult ExerciseTemplate::evaluate(const ImuSample* samples,
                                            size_t count) const {
    EvaluationResult result;

    if (!hasTemplate_ || samples == nullptr || count < 2) {
        return result;
    }

    FeatureFrame candidate[AppConfig::TEMPLATE_SAMPLES];
    if (!resampleAndNormalize(samples, count, candidate)) {
        return result;
    }

    float rollSquaredError = 0.0f;
    float pitchSquaredError = 0.0f;
    float gxSquaredError = 0.0f;
    float gySquaredError = 0.0f;
    float gzSquaredError = 0.0f;
    float normalizedWeightedError = 0.0f;

    for (size_t i = 0; i < AppConfig::TEMPLATE_SAMPLES; ++i) {
        const float rollError = candidate[i].roll - templateFrames_[i].roll;
        const float pitchError = candidate[i].pitch - templateFrames_[i].pitch;
        const float gxError = candidate[i].gx - templateFrames_[i].gx;
        const float gyError = candidate[i].gy - templateFrames_[i].gy;
        const float gzError = candidate[i].gz - templateFrames_[i].gz;

        rollSquaredError += rollError * rollError;
        pitchSquaredError += pitchError * pitchError;
        gxSquaredError += gxError * gxError;
        gySquaredError += gyError * gyError;
        gzSquaredError += gzError * gzError;

        const float rollNormalized = rollError / AppConfig::ANGLE_ERROR_SCALE_DEG;
        const float pitchNormalized = pitchError / AppConfig::ANGLE_ERROR_SCALE_DEG;
        const float gxNormalized = gxError / AppConfig::GYRO_ERROR_SCALE_DPS;
        const float gyNormalized = gyError / AppConfig::GYRO_ERROR_SCALE_DPS;
        const float gzNormalized = gzError / AppConfig::GYRO_ERROR_SCALE_DPS;

        normalizedWeightedError +=
            0.30f * rollNormalized * rollNormalized +
            0.30f * pitchNormalized * pitchNormalized +
            0.133333f * gxNormalized * gxNormalized +
            0.133333f * gyNormalized * gyNormalized +
            0.133334f * gzNormalized * gzNormalized;
    }

    const float sampleDivisor = static_cast<float>(AppConfig::TEMPLATE_SAMPLES);

    result.rollRmse = sqrtf(rollSquaredError / sampleDivisor);
    result.pitchRmse = sqrtf(pitchSquaredError / sampleDivisor);
    result.gxRmse = sqrtf(gxSquaredError / sampleDivisor);
    result.gyRmse = sqrtf(gySquaredError / sampleDivisor);
    result.gzRmse = sqrtf(gzSquaredError / sampleDivisor);

    const float normalizedRmse =
        sqrtf(normalizedWeightedError / sampleDivisor);

    result.shapeScore = 100.0f * expf(-1.45f * normalizedRmse);

    result.durationMs = movementDurationMs(samples, count);
    result.durationRatio =
        averageDurationMs_ > 1.0f
            ? static_cast<float>(result.durationMs) / averageDurationMs_
            : 0.0f;

    if (result.durationRatio > 0.0f) {
        result.durationScore =
            100.0f * expf(-2.0f * fabsf(logf(result.durationRatio)));
    }

    result.totalScore =
        0.85f * result.shapeScore + 0.15f * result.durationScore;

    const bool durationIsValid =
        result.durationRatio >= AppConfig::MIN_DURATION_RATIO &&
        result.durationRatio <= AppConfig::MAX_DURATION_RATIO;

    result.valid = durationIsValid &&
                   result.totalScore >= scoreThreshold_;

    return result;
}

float ExerciseTemplate::scoreThreshold() const {
    return scoreThreshold_;
}

void ExerciseTemplate::setScoreThreshold(float threshold) {
    if (threshold < 1.0f) {
        threshold = 1.0f;
    }
    if (threshold > 100.0f) {
        threshold = 100.0f;
    }

    scoreThreshold_ = threshold;
}

bool ExerciseTemplate::exportData(StoredTemplate& output) const {
    if (!hasTemplate_) {
        return false;
    }

    memset(&output, 0, sizeof(output));

    output.magic = AppConfig::TEMPLATE_MAGIC;
    output.version = AppConfig::TEMPLATE_VERSION;
    output.templateSamples = AppConfig::TEMPLATE_SAMPLES;
    output.featureCount = AppConfig::FEATURE_COUNT;
    output.trainingRepetitions = templateTrainingRepetitions_;
    output.averageDurationMs = averageDurationMs_;
    output.scoreThreshold = scoreThreshold_;

    memcpy(output.frames, templateFrames_, sizeof(templateFrames_));
    return true;
}

bool ExerciseTemplate::importData(const StoredTemplate& input) {
    if (input.magic != AppConfig::TEMPLATE_MAGIC ||
        input.version != AppConfig::TEMPLATE_VERSION ||
        input.templateSamples != AppConfig::TEMPLATE_SAMPLES ||
        input.featureCount != AppConfig::FEATURE_COUNT) {
        return false;
    }

    memcpy(templateFrames_, input.frames, sizeof(templateFrames_));

    averageDurationMs_ = input.averageDurationMs;
    templateTrainingRepetitions_ = input.trainingRepetitions;
    scoreThreshold_ = input.scoreThreshold;

    if (scoreThreshold_ < 1.0f || scoreThreshold_ > 100.0f) {
        scoreThreshold_ = AppConfig::DEFAULT_VALID_SCORE_THRESHOLD;
    }

    hasTemplate_ = true;
    trainingActive_ = false;
    trainingComplete_ = false;
    return true;
}

bool ExerciseTemplate::resampleAndNormalize(const ImuSample* samples,
                                            size_t count,
                                            FeatureFrame* output) {
    if (samples == nullptr || output == nullptr || count < 2) {
        return false;
    }

    const float initialRoll = samples[0].roll;
    const float initialPitch = samples[0].pitch;

    for (size_t i = 0; i < AppConfig::TEMPLATE_SAMPLES; ++i) {
        const float position =
            static_cast<float>(i) * static_cast<float>(count - 1) /
            static_cast<float>(AppConfig::TEMPLATE_SAMPLES - 1);

        const size_t lowerIndex = static_cast<size_t>(floorf(position));
        size_t upperIndex = lowerIndex + 1;
        if (upperIndex >= count) {
            upperIndex = count - 1;
        }

        const float fraction = position - static_cast<float>(lowerIndex);

        const ImuSample& lower = samples[lowerIndex];
        const ImuSample& upper = samples[upperIndex];

        const float interpolatedRoll =
            lower.roll + fraction * angleDifference(upper.roll, lower.roll);
        const float interpolatedPitch =
            lower.pitch + fraction * angleDifference(upper.pitch, lower.pitch);

        output[i].roll = angleDifference(interpolatedRoll, initialRoll);
        output[i].pitch = angleDifference(interpolatedPitch, initialPitch);
        output[i].gx = lower.gx + fraction * (upper.gx - lower.gx);
        output[i].gy = lower.gy + fraction * (upper.gy - lower.gy);
        output[i].gz = lower.gz + fraction * (upper.gz - lower.gz);
    }

    return true;
}

float ExerciseTemplate::angleDifference(float angle, float reference) {
    float difference = angle - reference;

    while (difference > 180.0f) {
        difference -= 360.0f;
    }
    while (difference < -180.0f) {
        difference += 360.0f;
    }

    return difference;
}

uint32_t ExerciseTemplate::movementDurationMs(const ImuSample* samples,
                                              size_t count) {
    if (samples == nullptr || count < 2) {
        return 0;
    }

    return samples[count - 1].timestampMs - samples[0].timestampMs;
}
