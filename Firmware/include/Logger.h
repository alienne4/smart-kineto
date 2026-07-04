#pragma once

#include <Arduino.h>

enum class LogLevel : uint8_t {
    Debug = 0,
    Info,
    Warning,
    Error
};

class Logger {
public:
    static void begin(LogLevel minimumLevel = LogLevel::Debug);
    static void setMinimumLevel(LogLevel minimumLevel);

    static void debug(const char* format, ...);
    static void info(const char* format, ...);
    static void warning(const char* format, ...);
    static void error(const char* format, ...);

private:
    static LogLevel minimumLevel_;

    static void write(LogLevel level, const char* format, va_list arguments);
    static const char* levelText(LogLevel level);
};
