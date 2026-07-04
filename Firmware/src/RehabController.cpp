#include "RehabController.h"

#include "AppConfig.h"
#include "Logger.h"

void RehabController::begin() {
    Serial.begin(AppConfig::SERIAL_BAUD);

    const uint32_t serialWaitStart = millis();
    while (!Serial && millis() - serialWaitStart < AppConfig::SERIAL_WAIT_MS) {
        delay(10);
    }

    Logger::begin(LogLevel::Debug);

    pinMode(AppConfig::BUTTON_PIN, INPUT_PULLUP);
    pinMode(AppConfig::LED_PIN, OUTPUT);
    digitalWrite(AppConfig::LED_PIN, LOW);

    buttonLastRaw_ = digitalRead(AppConfig::BUTTON_PIN);
    buttonStableState_ = buttonLastRaw_;

    console_.begin();
    ble_.begin();

    Serial.println();
    Serial.println("====================================================");
    Serial.println("       REHAB MOTION VALIDATOR - ESP32-S3");
    Serial.println("====================================================");

    Logger::info("Firmware pornit.");
    Logger::info("Esantionare IMU: %u Hz", AppConfig::SAMPLE_RATE_HZ);

    storageReady_ = storage_.begin();
    if (storageReady_) {
        storage_.load(exerciseTemplate_);
    }

    tryInitializeImu();

    nextSampleMicros_ = micros();
    console_.printHelp();
    printStatus();
}

void RehabController::loop() {
    processSerialCommands();
    processButton();
    updateLed();

    if (ble_.consumeCalibrationRequest()) {
        recalibrate();
    }

    if (!imuReady_) {
        if (millis() - lastSensorRetryMs_ >= AppConfig::SENSOR_RETRY_INTERVAL_MS) {
            tryInitializeImu();
        }
        delay(2);
        return;
    }

    processSampling();
}

void RehabController::tryInitializeImu() {
    lastSensorRetryMs_ = millis();

    Logger::info("Initializare MPU6050...");
    imuReady_ = imu_.begin();

    if (!imuReady_) {
        Logger::error("IMU indisponibil. Firmware-ul va reincerca automat.");
        return;
    }

    motionDetector_.cancel();
    nextSampleMicros_ = micros();
}

void RehabController::processSampling() {
    const uint32_t nowMicros = micros();

    if (static_cast<int32_t>(nowMicros - nextSampleMicros_) < 0) {
        return;
    }

    nextSampleMicros_ += AppConfig::SAMPLE_PERIOD_US;

    if (static_cast<int32_t>(nowMicros - nextSampleMicros_) >
        static_cast<int32_t>(AppConfig::SAMPLE_PERIOD_US * 4UL)) {
        nextSampleMicros_ = nowMicros + AppConfig::SAMPLE_PERIOD_US;
    }

    ImuSample sample;
    if (!imu_.readSample(sample)) {
        Logger::error("Citirea MPU6050 a esuat.");
        imuReady_ = false;
        return;
    }

    processSample(sample);
}

void RehabController::processSample(const ImuSample& sample) {
    printSample(sample);
    ble_.notifySample(sample);

    if (mode_ == SystemMode::Idle) {
        return;
    }

    if (motionDetector_.update(sample)) {
        processCompletedMovement();
        motionDetector_.reset();
    }
}

void RehabController::processCompletedMovement() {
    const ImuSample* samples = motionDetector_.samples();
    const size_t count = motionDetector_.sampleCount();

    if (count < AppConfig::MIN_MOVEMENT_SAMPLES) {
        Logger::warning("Miscare ignorata: prea putine esantioane.");
        return;
    }

    if (mode_ == SystemMode::Training) {
        if (!exerciseTemplate_.addTrainingMovement(samples, count)) {
            Logger::error("Repetarea terapeutului nu a putut fi memorata.");
            return;
        }

        Logger::info("Progres antrenare: %u/%u",
                     exerciseTemplate_.trainingCollected(),
                     exerciseTemplate_.trainingTarget());

        if (exerciseTemplate_.isTrainingComplete()) {
            if (storageReady_) {
                storage_.save(exerciseTemplate_);
            }

            mode_ = SystemMode::Idle;
            pulseLed(700);

            Logger::info("ANTRENARE TERMINATA. Aparatul este pregatit pentru pacient.");
            printStatus();
        }

        return;
    }

    if (mode_ == SystemMode::Exercise) {
        const EvaluationResult result = exerciseTemplate_.evaluate(samples, count);

        if (result.valid) {
            ++validRepetitions_;
            pulseLed(350);
        } else {
            ++invalidRepetitions_;
            pulseLed(80);
        }

        printEvaluation(result);
    }
}

void RehabController::processSerialCommands() {
    ConsoleCommand command;

    while (console_.poll(command)) {
        executeCommand(command);
    }
}

void RehabController::executeCommand(const ConsoleCommand& command) {
    Logger::debug("Comanda seriala: %s", command.raw.c_str());

    switch (command.type) {
        case CommandType::Help:
            console_.printHelp();
            break;

        case CommandType::Status:
            printStatus();
            break;

        case CommandType::Train:
            startTraining(static_cast<uint8_t>(command.integerArgument));
            break;

        case CommandType::StartExercise:
            startExercise();
            break;

        case CommandType::Stop:
            stopCurrentMode();
            break;

        case CommandType::EraseTemplate:
            eraseTemplate();
            break;

        case CommandType::Calibrate:
            recalibrate();
            break;

        case CommandType::StreamOff:
            streamMode_ = StreamMode::Off;
            Logger::info("Fluxul continuu de date a fost oprit.");
            break;

        case CommandType::StreamNormal:
            streamMode_ = StreamMode::Normal;
            Logger::info("Flux de date activ la aproximativ 10 Hz.");
            break;

        case CommandType::StreamFull:
            streamMode_ = StreamMode::Full;
            Logger::info("Flux complet activ la aproximativ 50 Hz.");
            break;

        case CommandType::SetThreshold:
            exerciseTemplate_.setScoreThreshold(command.floatArgument);
            Logger::info("Pragul de validare a fost setat la %.1f/100.",
                         exerciseTemplate_.scoreThreshold());
            if (storageReady_ && exerciseTemplate_.hasTemplate()) {
                storage_.save(exerciseTemplate_);
            }
            break;

        case CommandType::ResetCounters:
            validRepetitions_ = 0;
            invalidRepetitions_ = 0;
            Logger::info("Contoarele au fost resetate.");
            break;

        case CommandType::Unknown:
            Logger::warning("Comanda necunoscuta: %s", command.raw.c_str());
            Logger::warning("Scrie 'help' pentru lista comenzilor.");
            break;

        case CommandType::None:
        default:
            break;
    }
}

void RehabController::processButton() {
    const uint32_t now = millis();
    const bool rawState = digitalRead(AppConfig::BUTTON_PIN);

    if (rawState != buttonLastRaw_) {
        buttonLastRaw_ = rawState;
        buttonLastChangeMs_ = now;
    }

    if (now - buttonLastChangeMs_ < AppConfig::BUTTON_DEBOUNCE_MS) {
        return;
    }

    if (rawState == buttonStableState_) {
        return;
    }

    buttonStableState_ = rawState;

    if (buttonStableState_ == LOW) {
        buttonPressedAtMs_ = now;
        return;
    }

    const uint32_t pressDuration = now - buttonPressedAtMs_;

    if (pressDuration >= AppConfig::BUTTON_LONG_PRESS_MS) {
        startTraining(AppConfig::DEFAULT_TRAINING_REPETITIONS);
        return;
    }

    if (mode_ == SystemMode::Idle) {
        startExercise();
    } else {
        stopCurrentMode();
    }
}

void RehabController::startTraining(uint8_t repetitions) {
    if (!imuReady_) {
        Logger::error("Nu se poate incepe antrenarea: MPU6050 nu este disponibil.");
        return;
    }

    if (repetitions < 1) {
        repetitions = 1;
    }
    if (repetitions > AppConfig::MAX_TRAINING_REPETITIONS) {
        repetitions = AppConfig::MAX_TRAINING_REPETITIONS;
    }

    mode_ = SystemMode::Training;
    motionDetector_.cancel();
    exerciseTemplate_.beginTraining(repetitions);

    Logger::info("MOD TERAPEUT activ.");
    Logger::info("Executa %u repetari corecte, cu pauza scurta intre ele.", repetitions);
    Logger::info("Aparatul detecteaza automat inceputul si sfarsitul fiecarei miscari.");
}

void RehabController::startExercise() {
    if (!imuReady_) {
        Logger::error("Nu se poate porni modul pacient: MPU6050 nu este disponibil.");
        return;
    }

    if (!exerciseTemplate_.hasTemplate()) {
        Logger::error("Nu exista template. Ruleaza mai intai comanda 'train 3'.");
        return;
    }

    if (exerciseTemplate_.isTrainingActive()) {
        exerciseTemplate_.cancelTraining();
    }

    mode_ = SystemMode::Exercise;
    motionDetector_.cancel();

    Logger::info("MOD PACIENT activ.");
    Logger::info("Prag validare=%.1f/100. Repetarile valide vor fi numarate.",
                 exerciseTemplate_.scoreThreshold());
}

void RehabController::stopCurrentMode() {
    if (mode_ == SystemMode::Training && exerciseTemplate_.isTrainingActive()) {
        exerciseTemplate_.cancelTraining();
    }

    mode_ = SystemMode::Idle;
    motionDetector_.cancel();

    Logger::info("Sistem oprit. Mod IDLE.");
    printStatus();
}

void RehabController::eraseTemplate() {
    stopCurrentMode();

    if (storageReady_) {
        storage_.erase();
    }

    exerciseTemplate_.clear();
    validRepetitions_ = 0;
    invalidRepetitions_ = 0;

    Logger::warning("Template-ul si contoarele au fost sterse.");
}

void RehabController::recalibrate() {
    if (!imuReady_) {
        Logger::error("MPU6050 nu este disponibil pentru calibrare.");
        return;
    }

    if (mode_ != SystemMode::Idle) {
        Logger::warning("Opreste modul curent inainte de calibrare.");
        return;
    }

    if (imu_.recalibrateGyroscope()) {
        motionDetector_.cancel();
        Logger::info("Recalibrare terminata.");
    } else {
        Logger::error("Recalibrarea a esuat.");
    }
}

void RehabController::printStatus() const {
    Serial.println();
    Serial.println("---------------- STATUS SISTEM ----------------");
    Serial.printf("Mod: %s\n", modeText(mode_));
    Serial.printf("MPU6050: %s\n", imuReady_ ? "CONECTAT" : "DECONECTAT");
    Serial.printf("Template: %s\n",
                  exerciseTemplate_.hasTemplate() ? "DISPONIBIL" : "LIPSA");

    if (exerciseTemplate_.hasTemplate()) {
        Serial.printf("Repetari terapeut folosite: %u\n",
                      exerciseTemplate_.templateTrainingRepetitions());
        Serial.printf("Durata medie template: %.0f ms\n",
                      exerciseTemplate_.averageDurationMs());
        Serial.printf("Prag validare: %.1f/100\n",
                      exerciseTemplate_.scoreThreshold());
    }

    if (exerciseTemplate_.isTrainingActive()) {
        Serial.printf("Antrenare: %u/%u\n",
                      exerciseTemplate_.trainingCollected(),
                      exerciseTemplate_.trainingTarget());
    }

    Serial.printf("Repetari valide pacient: %lu\n",
                  static_cast<unsigned long>(validRepetitions_));
    Serial.printf("Repetari respinse pacient: %lu\n",
                  static_cast<unsigned long>(invalidRepetitions_));
    Serial.printf("Detector: %s\n", motionDetector_.stateText());
    Serial.println("------------------------------------------------");
    Serial.println();
}

void RehabController::printSample(const ImuSample& sample) {
    if (streamMode_ == StreamMode::Off) {
        return;
    }

    if (streamMode_ == StreamMode::Normal) {
        if (millis() - lastStreamMs_ < AppConfig::NORMAL_STREAM_INTERVAL_MS) {
            return;
        }
        lastStreamMs_ = millis();
    }

    const float rawMotion =
    imu_.motionLevel(sample);

const float detectorMotion =
    motionDetector_.lastMotionLevel();

Serial.printf(
    "[DATA] mode=%s detector=%s "
    "roll=%7.2f pitch=%7.2f "
    "gx=%8.2f gy=%8.2f gz=%8.2f "
    "raw=%7.2f filtered=%7.2f "
    "temp=%5.1f\n",
    modeText(mode_),
    motionDetector_.stateText(),
    sample.roll,
    sample.pitch,
    sample.gx,
    sample.gy,
    sample.gz,
    rawMotion,
    detectorMotion,
    sample.temperatureC
);
}

void RehabController::printEvaluation(const EvaluationResult& result) {
    Serial.println();
    Serial.println("================ REZULTAT REPETARE ================");
    Serial.printf("Verdict: %s\n", result.valid ? "VALIDA" : "RESPINSA");
    Serial.printf("Scor total: %.1f/100\n", result.totalScore);
    Serial.printf("Scor forma: %.1f/100\n", result.shapeScore);
    Serial.printf("Scor durata: %.1f/100\n", result.durationScore);
    Serial.printf("Durata: %lu ms, raport fata de terapeut: %.2f\n",
                  static_cast<unsigned long>(result.durationMs),
                  result.durationRatio);
    Serial.printf("RMSE roll/pitch: %.2f / %.2f deg\n",
                  result.rollRmse,
                  result.pitchRmse);
    Serial.printf("RMSE gyro X/Y/Z: %.2f / %.2f / %.2f deg/s\n",
                  result.gxRmse,
                  result.gyRmse,
                  result.gzRmse);
    Serial.printf("Total valide: %lu | Total respinse: %lu\n",
                  static_cast<unsigned long>(validRepetitions_),
                  static_cast<unsigned long>(invalidRepetitions_));
    Serial.println("====================================================");
    Serial.println();
}

void RehabController::updateLed() {
    if (mode_ == SystemMode::Training) {
        digitalWrite(AppConfig::LED_PIN, HIGH);
        return;
    }

    digitalWrite(
        AppConfig::LED_PIN,
        millis() < ledPulseUntilMs_ ? HIGH : LOW);
}

void RehabController::pulseLed(uint32_t durationMs) {
    ledPulseUntilMs_ = millis() + durationMs;
}

const char* RehabController::modeText(SystemMode mode) {
    switch (mode) {
        case SystemMode::Idle:
            return "IDLE";
        case SystemMode::Training:
            return "TRAINING";
        case SystemMode::Exercise:
            return "EXERCISE";
        default:
            return "UNKNOWN";
    }
}
