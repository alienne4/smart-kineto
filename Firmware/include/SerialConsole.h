#pragma once

#include <Arduino.h>

enum class CommandType : uint8_t {
    None,
    Help,
    Status,
    Train,
    StartExercise,
    Stop,
    EraseTemplate,
    Calibrate,
    StreamOff,
    StreamNormal,
    StreamFull,
    SetThreshold,
    ResetCounters,
    Unknown
};

struct ConsoleCommand {
    CommandType type = CommandType::None;

    int integerArgument = 0;
    float floatArgument = 0.0f;

    String raw;
};

class SerialConsole {
public:
    void begin();

    bool poll(ConsoleCommand& command);

    void printHelp() const;

private:
    String inputBuffer_;

    uint32_t lastCharacterTimeMs_ = 0;

    static constexpr uint32_t COMMAND_TIMEOUT_MS = 100;

    bool finishCommand(ConsoleCommand& command);

    static ConsoleCommand parseCommand(String line);
};