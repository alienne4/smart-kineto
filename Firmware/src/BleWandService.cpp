#include "BleWandService.h"

#include <cmath>

#include "AppConfig.h"
#include "Logger.h"

namespace {

// Wire format for the IMU notify characteristic — 14 bytes, little-endian,
// one sample per notification (no batching needed at this size/rate).
// Mirrored in the app (BleWandClient.ts) and web (BleWandClient.ts) clients.
struct __attribute__((packed)) BleImuPacket {
    uint32_t t_ms;        // device uptime, ms (informational — clients timestamp locally)
    int16_t roll_x100;    // degrees * 100
    int16_t pitch_x100;   // degrees * 100
    int16_t gx_x10;       // deg/s * 10
    int16_t gy_x10;       // deg/s * 10
    int16_t gz_x10;       // deg/s * 10
};

}  // namespace

void BleWandService::begin() {
    NimBLEDevice::init(AppConfig::BLE_DEVICE_NAME);

    server_ = NimBLEDevice::createServer();
    server_->setCallbacks(this);

    NimBLEService* service = server_->createService(AppConfig::BLE_SERVICE_UUID);

    imuChar_ = service->createCharacteristic(AppConfig::BLE_IMU_CHAR_UUID, NIMBLE_PROPERTY::NOTIFY);

    controlChar_ = service->createCharacteristic(AppConfig::BLE_CONTROL_CHAR_UUID, NIMBLE_PROPERTY::WRITE);
    controlChar_->setCallbacks(this);

    service->start();

    NimBLEAdvertising* advertising = NimBLEDevice::getAdvertising();
    advertising->addServiceUUID(AppConfig::BLE_SERVICE_UUID);
    advertising->enableScanResponse(true);
    advertising->start();

    Logger::info("BLE: serviciu wand pornit, advertising activ ca '%s'.", AppConfig::BLE_DEVICE_NAME);
}

void BleWandService::notifySample(const ImuSample& sample) {
    if (imuChar_ == nullptr || imuChar_->getSubscribedCount() == 0) {
        return;
    }

    BleImuPacket packet;
    packet.t_ms = sample.timestampMs;
    packet.roll_x100 = static_cast<int16_t>(lroundf(sample.roll * 100.0f));
    packet.pitch_x100 = static_cast<int16_t>(lroundf(sample.pitch * 100.0f));
    packet.gx_x10 = static_cast<int16_t>(lroundf(sample.gx * 10.0f));
    packet.gy_x10 = static_cast<int16_t>(lroundf(sample.gy * 10.0f));
    packet.gz_x10 = static_cast<int16_t>(lroundf(sample.gz * 10.0f));

    imuChar_->setValue(reinterpret_cast<const uint8_t*>(&packet), sizeof(packet));
    imuChar_->notify();
}

bool BleWandService::consumeCalibrationRequest() {
    if (!calibrationRequested_) {
        return false;
    }
    calibrationRequested_ = false;
    return true;
}

void BleWandService::onConnect(NimBLEServer* /*server*/, NimBLEConnInfo& /*connInfo*/) {
    Logger::info("BLE: central conectat.");
}

void BleWandService::onDisconnect(NimBLEServer* /*server*/, NimBLEConnInfo& /*connInfo*/, int reason) {
    Logger::info("BLE: central deconectat (motiv=%d). Repornire advertising.", reason);
    NimBLEDevice::startAdvertising();
}

void BleWandService::onWrite(NimBLECharacteristic* characteristic, NimBLEConnInfo& /*connInfo*/) {
    if (characteristic != controlChar_) {
        return;
    }

    const std::string value = characteristic->getValue();
    if (!value.empty() && static_cast<uint8_t>(value[0]) == AppConfig::BLE_CMD_CALIBRATE) {
        calibrationRequested_ = true;
    }
}
