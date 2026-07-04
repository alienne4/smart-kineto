#include "Logger.h"

#include <cstdarg>
#include <cstdio>

LogLevel Logger::minimumLevel_ = LogLevel::Debug;

void Logger::begin(LogLevel minimumLevel) {
    minimumLevel_ = minimumLevel;
}

void Logger::setMinimumLevel(LogLevel minimumLevel) {
    minimumLevel_ = minimumLevel;
}

void Logger::debug(const char* format, ...) {
    va_list arguments;
    va_start(arguments, format);
    write(LogLevel::Debug, format, arguments);
    va_end(arguments);
}

void Logger::info(const char* format, ...) {
    va_list arguments;
    va_start(arguments, format);
    write(LogLevel::Info, format, arguments);
    va_end(arguments);
}

void Logger::warning(const char* format, ...) {
    va_list arguments;
    va_start(arguments, format);
    write(LogLevel::Warning, format, arguments);
    va_end(arguments);
}

void Logger::error(const char* format, ...) {
    va_list arguments;
    va_start(arguments, format);
    write(LogLevel::Error, format, arguments);
    va_end(arguments);
}

void Logger::write(LogLevel level, const char* format, va_list arguments) {
    if (static_cast<uint8_t>(level) < static_cast<uint8_t>(minimumLevel_)) {
        return;
    }

    char message[320];
    vsnprintf(message, sizeof(message), format, arguments);

    Serial.printf("[%10lu][%-5s] %s\n",
                  static_cast<unsigned long>(millis()),
                  levelText(level),
                  message);
}

const char* Logger::levelText(LogLevel level) {
    switch (level) {
        case LogLevel::Debug:
            return "DEBUG";
        case LogLevel::Info:
            return "INFO";
        case LogLevel::Warning:
            return "WARN";
        case LogLevel::Error:
            return "ERROR";
        default:
            return "LOG";
    }
}
