#include "TemplateStorage.h"

#include <cstddef>

#include "AppConfig.h"
#include "Logger.h"

bool TemplateStorage::begin() {
    opened_ = preferences_.begin(AppConfig::PREFERENCES_NAMESPACE, false);

    if (!opened_) {
        Logger::error("Nu s-a putut deschide memoria Preferences.");
        return false;
    }

    Logger::info("Memoria persistenta Preferences este pregatita.");
    return true;
}

bool TemplateStorage::load(ExerciseTemplate& exerciseTemplate) {
    if (!opened_) {
        return false;
    }

    const size_t storedLength =
        preferences_.getBytesLength(AppConfig::TEMPLATE_KEY);

    if (storedLength == 0) {
        Logger::warning("Nu exista niciun template salvat.");
        return false;
    }

    if (storedLength != sizeof(StoredTemplate)) {
        Logger::error("Template salvat incompatibil. Lungime=%u, asteptat=%u.",
                      static_cast<unsigned>(storedLength),
                      static_cast<unsigned>(sizeof(StoredTemplate)));
        return false;
    }

    StoredTemplate data;
    const size_t bytesRead = preferences_.getBytes(
        AppConfig::TEMPLATE_KEY,
        &data,
        sizeof(data));

    if (bytesRead != sizeof(data)) {
        Logger::error("Citirea template-ului din memorie a esuat.");
        return false;
    }

    const uint32_t expectedChecksum = calculateChecksum(data);
    if (expectedChecksum != data.checksum) {
        Logger::error("Checksum invalid pentru template-ul salvat.");
        return false;
    }

    if (!exerciseTemplate.importData(data)) {
        Logger::error("Template-ul salvat are format invalid.");
        return false;
    }

    Logger::info("Template incarcat: %u repetari terapeut, durata medie=%.0f ms, prag=%.1f.",
                 data.trainingRepetitions,
                 data.averageDurationMs,
                 data.scoreThreshold);

    return true;
}

bool TemplateStorage::save(const ExerciseTemplate& exerciseTemplate) {
    if (!opened_) {
        return false;
    }

    StoredTemplate data;
    if (!exerciseTemplate.exportData(data)) {
        Logger::error("Nu exista un template valid de salvat.");
        return false;
    }

    data.checksum = calculateChecksum(data);

    const size_t bytesWritten = preferences_.putBytes(
        AppConfig::TEMPLATE_KEY,
        &data,
        sizeof(data));

    if (bytesWritten != sizeof(data)) {
        Logger::error("Salvarea template-ului a esuat.");
        return false;
    }

    Logger::info("Template salvat permanent in memoria ESP32.");
    return true;
}

bool TemplateStorage::erase() {
    if (!opened_) {
        return false;
    }

    const bool result = preferences_.remove(AppConfig::TEMPLATE_KEY);

    if (result) {
        Logger::info("Template-ul persistent a fost sters.");
    } else {
        Logger::warning("Nu exista template persistent sau stergerea a esuat.");
    }

    return result;
}

uint32_t TemplateStorage::calculateChecksum(const StoredTemplate& data) {
    const uint8_t* bytes = reinterpret_cast<const uint8_t*>(&data);
    const size_t length = offsetof(StoredTemplate, checksum);

    uint32_t hash = 2166136261UL;
    for (size_t i = 0; i < length; ++i) {
        hash ^= bytes[i];
        hash *= 16777619UL;
    }

    return hash;
}
