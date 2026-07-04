#pragma once

#include <Arduino.h>

#include "BleWandService.h"
#include "ExerciseTemplate.h"
#include "ImuManager.h"
#include "MotionDetector.h"
#include "SerialConsole.h"
#include "TemplateStorage.h"
#include "Types.h"

class RehabController {
public:
    void begin();
    void loop();

private:
    ImuManager imu_;
    MotionDetector motionDetector_;
    ExerciseTemplate exerciseTemplate_;
    TemplateStorage storage_;
    SerialConsole console_;
    BleWandService ble_;

    SystemMode mode_ = SystemMode::Idle;
    StreamMode streamMode_ = StreamMode::Normal;

    bool imuReady_ = false;
    bool storageReady_ = false;

    uint32_t nextSampleMicros_ = 0;
    uint32_t lastStreamMs_ = 0;
    uint32_t lastSensorRetryMs_ = 0;

    uint32_t validRepetitions_ = 0;
    uint32_t invalidRepetitions_ = 0;

    bool buttonLastRaw_ = HIGH;
    bool buttonStableState_ = HIGH;
    uint32_t buttonLastChangeMs_ = 0;
    uint32_t buttonPressedAtMs_ = 0;

    uint32_t ledPulseUntilMs_ = 0;

    void tryInitializeImu();
    void processSampling();
    void processSample(const ImuSample& sample);
    void processCompletedMovement();

    void processSerialCommands();
    void executeCommand(const ConsoleCommand& command);
    void processButton();

    void startTraining(uint8_t repetitions);
    void startExercise();
    void stopCurrentMode();
    void eraseTemplate();
    void recalibrate();

    void printStatus() const;
    void printSample(const ImuSample& sample);
    void printEvaluation(const EvaluationResult& result);

    void updateLed();
    void pulseLed(uint32_t durationMs);

    static const char* modeText(SystemMode mode);
};
