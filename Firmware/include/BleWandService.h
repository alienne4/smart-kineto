#pragma once

#include <NimBLEDevice.h>

#include "Types.h"

/*
 * Streams IMU samples over a custom BLE GATT service so the mobile/web app can
 * consume them as a "wand" motion source. This is purely additive: it never
 * changes the existing serial/motion-detection/on-device scoring path, it
 * just taps the same samples RehabController already computes.
 */
class BleWandService : public NimBLEServerCallbacks, public NimBLECharacteristicCallbacks {
public:
    void begin();
    void notifySample(const ImuSample& sample);

    // True at most once per received calibrate command; clears on read.
    bool consumeCalibrationRequest();

private:
    void onConnect(NimBLEServer* server, NimBLEConnInfo& connInfo) override;
    void onDisconnect(NimBLEServer* server, NimBLEConnInfo& connInfo, int reason) override;
    void onWrite(NimBLECharacteristic* characteristic, NimBLEConnInfo& connInfo) override;

    NimBLEServer* server_ = nullptr;
    NimBLECharacteristic* imuChar_ = nullptr;
    NimBLECharacteristic* controlChar_ = nullptr;
    volatile bool calibrationRequested_ = false;
};
