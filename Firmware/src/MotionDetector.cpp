#include "MotionDetector.h"

#include <cmath>

#include "AppConfig.h"
#include "Logger.h"

MotionDetector::MotionDetector() {
    cancel();
}

bool MotionDetector::update(
    const ImuSample& sample
) {
    /*
     * Calculam nivelul brut dupa eliminarea zgomotului
     * foarte mic de pe fiecare axa.
     */
    rawMotionLevel_ =
        calculateMotionLevel(sample);

    /*
     * Filtru low-pass exponential:
     *
     * filtered =
     *   alpha * filteredAnterior +
     *   (1 - alpha) * valoareNoua
     */
    if (filteredMotionLevel_ <= 0.0001f) {
        filteredMotionLevel_ =
            rawMotionLevel_;
    } else {
        filteredMotionLevel_ =
            AppConfig::MOTION_FILTER_ALPHA *
                filteredMotionLevel_ +
            (
                1.0f -
                AppConfig::MOTION_FILTER_ALPHA
            ) *
                rawMotionLevel_;
    }

    lastMotionLevel_ =
        filteredMotionLevel_;

    if (
        state_ ==
        MotionDetectorState::Complete
    ) {
        return true;
    }

    /*
     * =================================================
     * STAREA WAITING
     * =================================================
     */
    if (
        state_ ==
        MotionDetectorState::Waiting
    ) {
        pushPreTrigger(sample);

        if (millis() < blockedUntilMs_) {
            return false;
        }

        /*
         * Pornim numai daca miscarea depaseste pragul
         * mai multe esantioane consecutive.
         */
        if (
            filteredMotionLevel_ >=
            AppConfig::START_MOTION_THRESHOLD_DPS
        ) {
            ++startConfirmationCount_;
        } else {
            startConfirmationCount_ = 0;
        }

        if (
            startConfirmationCount_ >=
            AppConfig::START_CONFIRM_SAMPLES
        ) {
            beginCapture();

            Logger::info(
                "Miscare reala detectata. "
                "Nivel filtrat=%.2f deg/s. "
                "Incepe capturarea.",
                filteredMotionLevel_
            );
        }

        return false;
    }

    /*
     * =================================================
     * STAREA CAPTURING
     * =================================================
     */

    appendSample(sample);

    /*
     * Acum orice valoare sub 6 deg/s este considerata
     * repaus relativ. Utilizatorul nu trebuie sa fie
     * perfect nemiscat.
     */
    if (
        filteredMotionLevel_ <=
        AppConfig::STOP_MOTION_THRESHOLD_DPS
    ) {
        ++stopConfirmationCount_;
    } else {
        stopConfirmationCount_ = 0;
    }

    const bool enoughSamples =
        captureCount_ >=
        AppConfig::MIN_MOVEMENT_SAMPLES;

    const bool movementStopped =
        stopConfirmationCount_ >=
        AppConfig::STOP_CONFIRM_SAMPLES;

    const bool bufferFull =
        captureCount_ >=
        AppConfig::MAX_CAPTURE_SAMPLES;

    /*
     * O captura care ajunge la limita maxima nu este
     * o repetare valida. Inseamna ca sfarsitul miscarii
     * nu a fost detectat.
     *
     * Nu o trimitem catre template si nu o numaram.
     */
    if (bufferFull) {
        Logger::warning(
            "Captura anulata: s-a ajuns la limita de "
            "%u esantioane fara detectarea opririi. "
            "Repetarea NU a fost memorata.",
            static_cast<unsigned>(
                AppConfig::MAX_CAPTURE_SAMPLES
            )
        );

        reset();

        return false;
    }

    if (
        enoughSamples &&
        movementStopped
    ) {
        completeCapture();

        return true;
    }

    return false;
}

void MotionDetector::reset() {
    state_ =
        MotionDetectorState::Waiting;

    captureCount_ = 0;

    preTriggerCount_ = 0;
    preTriggerWriteIndex_ = 0;

    startConfirmationCount_ = 0;
    stopConfirmationCount_ = 0;

    rawMotionLevel_ = 0.0f;
    filteredMotionLevel_ = 0.0f;
    lastMotionLevel_ = 0.0f;

    blockedUntilMs_ =
        millis() +
        AppConfig::POST_MOVEMENT_COOLDOWN_MS;
}

void MotionDetector::cancel() {
    state_ =
        MotionDetectorState::Waiting;

    captureCount_ = 0;

    preTriggerCount_ = 0;
    preTriggerWriteIndex_ = 0;

    startConfirmationCount_ = 0;
    stopConfirmationCount_ = 0;

    blockedUntilMs_ = 0;

    rawMotionLevel_ = 0.0f;
    filteredMotionLevel_ = 0.0f;
    lastMotionLevel_ = 0.0f;
}

MotionDetectorState MotionDetector::state() const {
    return state_;
}

const char* MotionDetector::stateText() const {
    switch (state_) {
        case MotionDetectorState::Waiting:
            return "WAITING";

        case MotionDetectorState::Capturing:
            return "CAPTURING";

        case MotionDetectorState::Complete:
            return "COMPLETE";

        default:
            return "UNKNOWN";
    }
}

const ImuSample* MotionDetector::samples() const {
    return captureBuffer_;
}

size_t MotionDetector::sampleCount() const {
    return captureCount_;
}

uint32_t MotionDetector::durationMs() const {
    if (captureCount_ < 2) {
        return 0;
    }

    return
        captureBuffer_[
            captureCount_ - 1
        ].timestampMs -
        captureBuffer_[0].timestampMs;
}

float MotionDetector::lastMotionLevel() const {
    return lastMotionLevel_;
}

void MotionDetector::pushPreTrigger(
    const ImuSample& sample
) {
    preTriggerBuffer_[
        preTriggerWriteIndex_
    ] = sample;

    preTriggerWriteIndex_ =
        (
            preTriggerWriteIndex_ + 1
        ) %
        AppConfig::PRE_TRIGGER_SAMPLES;

    if (
        preTriggerCount_ <
        AppConfig::PRE_TRIGGER_SAMPLES
    ) {
        ++preTriggerCount_;
    }
}

void MotionDetector::beginCapture() {
    state_ =
        MotionDetectorState::Capturing;

    captureCount_ = 0;

    startConfirmationCount_ = 0;
    stopConfirmationCount_ = 0;

    const size_t firstIndex =
        (
            preTriggerWriteIndex_ +
            AppConfig::PRE_TRIGGER_SAMPLES -
            preTriggerCount_
        ) %
        AppConfig::PRE_TRIGGER_SAMPLES;

    /*
     * Copiem si esantioanele de dinaintea detectarii,
     * pentru a nu pierde inceputul miscarii.
     */
    for (
        size_t i = 0;
        i < preTriggerCount_;
        ++i
    ) {
        const size_t sourceIndex =
            (
                firstIndex + i
            ) %
            AppConfig::PRE_TRIGGER_SAMPLES;

        appendSample(
            preTriggerBuffer_[sourceIndex]
        );
    }
}

void MotionDetector::appendSample(
    const ImuSample& sample
) {
    if (
        captureCount_ >=
        AppConfig::MAX_CAPTURE_SAMPLES
    ) {
        return;
    }

    captureBuffer_[captureCount_] =
        sample;

    ++captureCount_;
}

void MotionDetector::completeCapture() {
    /*
     * Eliminam cea mai mare parte din pauza folosita
     * pentru confirmarea sfarsitului, dar pastram cateva
     * esantioane pentru finalul miscarii.
     */
    constexpr uint16_t samplesToKeepAtEnd = 4;

    if (
        stopConfirmationCount_ >
            samplesToKeepAtEnd &&
        captureCount_ >
            static_cast<size_t>(
                stopConfirmationCount_ -
                samplesToKeepAtEnd
            )
    ) {
        captureCount_ -=
            static_cast<size_t>(
                stopConfirmationCount_ -
                samplesToKeepAtEnd
            );
    }

    state_ =
        MotionDetectorState::Complete;

    Logger::info(
        "Captura finalizata corect: "
        "%u esantioane, durata=%lu ms, "
        "nivel final filtrat=%.2f deg/s",
        static_cast<unsigned>(
            captureCount_
        ),
        static_cast<unsigned long>(
            durationMs()
        ),
        filteredMotionLevel_
    );
}

float MotionDetector::calculateMotionLevel(
    const ImuSample& sample
) {
    /*
     * Eliminam zgomotul separat pe fiecare axa.
     */
    const float filteredX =
        applyDeadband(sample.gx);

    const float filteredY =
        applyDeadband(sample.gy);

    const float filteredZ =
        applyDeadband(sample.gz);

    return sqrtf(
        filteredX * filteredX +
        filteredY * filteredY +
        filteredZ * filteredZ
    );
}

float MotionDetector::applyDeadband(
    float value
) {
    const float magnitude =
        fabsf(value);

    if (
        magnitude <=
        AppConfig::GYRO_DEADBAND_DPS
    ) {
        return 0.0f;
    }

    /*
     * Nu taiem brusc doar la prag.
     * Scadem deadband-ul din valoarea ramasa.
     */
    const float correctedMagnitude =
        magnitude -
        AppConfig::GYRO_DEADBAND_DPS;

    return value >= 0.0f
        ? correctedMagnitude
        : -correctedMagnitude;
}