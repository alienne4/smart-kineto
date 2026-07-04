# SmartKinetoFit — Firmware

ESP32-S3 + MPU6050 "wand" device. PlatformIO / Arduino framework.

## What it does

The device runs two things in parallel:

1. **Standalone clinical mode** (unchanged, USB-serial + button + LED): a therapist trains a
   movement template on-device (`train N` / long button press), and a patient's repetitions are
   captured, scored against it, and validated entirely on-device. See the serial console (`help`)
   for the full command list. This keeps working exactly as before.
2. **BLE streaming** (new): the same 50 Hz IMU samples are also broadcast over a BLE GATT
   service, so the SmartKinetoFit mobile/web app can use the device as a live motion source —
   the app does its own start/stop-per-repetition buffering and sends captured frames to the
   Django backend (`backend/wand/`), which scores them with a Python port of the same algorithm
   used on-device (`src/ExerciseTemplate.cpp` ↔ `backend/wand/scoring.py`).

## BLE contract

Advertises as **`SmartKineto Wand`** with this custom GATT service:

| | UUID | Properties | Payload |
|---|---|---|---|
| Service | `3f14498e-fd41-4682-8056-1e15ff36adfa` | — | — |
| IMU characteristic | `158796bd-587e-425c-b161-43d08aa320dc` | Notify | 14-byte packed sample (below) |
| Control characteristic | `47584c68-23f8-4a64-bdca-b18c8d3698bf` | Write | 1 byte: `0x01` = recalibrate gyro |

There's no explicit start/stop command — the device streams samples whenever a central has
notifications enabled on the IMU characteristic (i.e. subscribing starts the stream, unsubscribing
or disconnecting stops it).

### IMU sample packet (little-endian, 14 bytes)

```c
struct {
  uint32_t t_ms;       // device uptime in ms — informational only; clients timestamp
                        // frames locally relative to when they started capturing, not this value
  int16_t  roll_x100;  // roll, degrees * 100
  int16_t  pitch_x100; // pitch, degrees * 100
  int16_t  gx_x10;     // gyro X, deg/s * 10
  int16_t  gy_x10;     // gyro Y, deg/s * 10
  int16_t  gz_x10;     // gyro Z, deg/s * 10
};
```

Decode: `roll = roll_x100 / 100.0`, etc. This mirrors the `{t_ms, roll, pitch, gx, gy, gz}` frame
shape already expected end-to-end by `backend/wand/`, `app/src/wand/`, and `web/src/wand/`.

Implementation: `include/BleWandService.h` / `src/BleWandService.cpp`, using
[NimBLE-Arduino](https://github.com/h2zero/NimBLE-Arduino) (lighter than the stock ESP32 Bluedroid
`BLEDevice` stack). Wired into `RehabController::processSample()` — a pure addition alongside the
existing serial print, and into `RehabController::loop()` to service calibrate requests via the
existing `recalibrate()` path.

## Build

```
pio run                 # build
pio run -t upload       # flash
pio device monitor      # serial console (115200 baud)
```

If the build complains about missing Bluetooth/NimBLE config, add `-D CONFIG_BT_ENABLED=1` to
`build_flags` in `platformio.ini` — this wasn't needed at the time of writing against
`pioarduino`'s `platform-espressif32`, but Arduino-ESP32 core defaults can vary by release.

Verify the BLE side independently of the app by scanning with a generic BLE tool (e.g. nRF
Connect) — you should see `SmartKineto Wand` advertising the service UUID above, with the IMU
characteristic's value changing once you subscribe to notifications.
