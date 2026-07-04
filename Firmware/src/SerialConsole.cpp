#include "SerialConsole.h"

#include "AppConfig.h"

void SerialConsole::begin() {
    inputBuffer_.reserve(128);
    lastCharacterTimeMs_ = 0;
}

bool SerialConsole::poll(ConsoleCommand& command) {
    while (Serial.available() > 0) {
        const char character =
            static_cast<char>(Serial.read());

        lastCharacterTimeMs_ = millis();

        // Enter primit sub formă CR sau LF
        if (character == '\r' || character == '\n') {
            if (finishCommand(command)) {
                return true;
            }

            continue;
        }

        // Ignorăm caracterele neprintabile, de exemplu Ctrl+C = 0x03
        if (character < 32 || character > 126) {
            continue;
        }

        if (inputBuffer_.length() < 120) {
            inputBuffer_ += character;
        }
    }

    /*
     * Unele terminale trimit textul fără \r sau \n.
     * Dacă nu mai vine niciun caracter timp de 100 ms,
     * considerăm că mesajul este complet.
     */
    if (
        inputBuffer_.length() > 0 &&
        millis() - lastCharacterTimeMs_ >= COMMAND_TIMEOUT_MS
    ) {
        return finishCommand(command);
    }

    return false;
}

bool SerialConsole::finishCommand(ConsoleCommand& command) {
    inputBuffer_.trim();

    if (inputBuffer_.length() == 0) {
        inputBuffer_ = "";
        return false;
    }

    command = parseCommand(inputBuffer_);

    inputBuffer_ = "";

    return true;
}

void SerialConsole::printHelp() const {
    Serial.println();

    Serial.println(
        "================ COMENZI DISPONIBILE ================"
    );

    Serial.println(
        "help               - afiseaza comenzile"
    );

    Serial.println(
        "status             - afiseaza starea sistemului"
    );

    Serial.println(
        "train [1..10]      - memoreaza miscarile terapeutului"
    );

    Serial.println(
        "start              - porneste modul pacient"
    );

    Serial.println(
        "stop               - opreste modul curent"
    );

    Serial.println(
        "calibrate          - recalibreaza giroscopul"
    );

    Serial.println(
        "erase              - sterge template-ul"
    );

    Serial.println(
        "threshold [1..100] - modifica pragul de validare"
    );

    Serial.println(
        "stream off         - opreste datele continue"
    );

    Serial.println(
        "stream on          - date la aproximativ 10 Hz"
    );

    Serial.println(
        "stream full        - date la aproximativ 50 Hz"
    );

    Serial.println(
        "resetcount         - reseteaza contoarele"
    );

    Serial.println();

    Serial.println(
        "Buton scurt: porneste/opreste modul pacient."
    );

    Serial.println(
        "Buton lung: antrenare cu 3 repetari."
    );

    Serial.println(
        "======================================================"
    );

    Serial.println();
}

ConsoleCommand SerialConsole::parseCommand(String line) {
    ConsoleCommand command;

    command.raw = line;

    line.trim();
    line.toLowerCase();

    if (line == "help" || line == "?") {
        command.type = CommandType::Help;
        return command;
    }

    if (line == "status") {
        command.type = CommandType::Status;
        return command;
    }

    if (line == "start" || line == "exercise") {
        command.type = CommandType::StartExercise;
        return command;
    }

    if (line == "stop") {
        command.type = CommandType::Stop;
        return command;
    }

    if (line == "erase") {
        command.type = CommandType::EraseTemplate;
        return command;
    }

    if (line == "calibrate") {
        command.type = CommandType::Calibrate;
        return command;
    }

    if (line == "resetcount") {
        command.type = CommandType::ResetCounters;
        return command;
    }

    if (line == "stream off") {
        command.type = CommandType::StreamOff;
        return command;
    }

    if (line == "stream on") {
        command.type = CommandType::StreamNormal;
        return command;
    }

    if (line == "stream full") {
        command.type = CommandType::StreamFull;
        return command;
    }

    if (line.startsWith("train")) {
        command.type = CommandType::Train;

        command.integerArgument =
            AppConfig::DEFAULT_TRAINING_REPETITIONS;

        const int separatorIndex = line.indexOf(' ');

        if (separatorIndex >= 0) {
            command.integerArgument =
                line.substring(separatorIndex + 1).toInt();
        }

        if (command.integerArgument < 1) {
            command.integerArgument = 1;
        }

        if (
            command.integerArgument >
            AppConfig::MAX_TRAINING_REPETITIONS
        ) {
            command.integerArgument =
                AppConfig::MAX_TRAINING_REPETITIONS;
        }

        return command;
    }

    if (line.startsWith("threshold ")) {
        command.type = CommandType::SetThreshold;

        command.floatArgument =
            line.substring(10).toFloat();

        return command;
    }

    command.type = CommandType::Unknown;

    return command;
}