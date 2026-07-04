#include <Arduino.h>

#include "RehabController.h"

RehabController rehabController;

void setup() {
    rehabController.begin();
}

void loop() {
    rehabController.loop();
}
