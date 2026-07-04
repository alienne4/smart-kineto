#pragma once

#include <Preferences.h>

#include "ExerciseTemplate.h"

class TemplateStorage {
public:
    bool begin();
    bool load(ExerciseTemplate& exerciseTemplate);
    bool save(const ExerciseTemplate& exerciseTemplate);
    bool erase();

private:
    Preferences preferences_;
    bool opened_ = false;

    static uint32_t calculateChecksum(const StoredTemplate& data);
};
