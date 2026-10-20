/*
 * VISIONCAP — ESP32-CAM Firmware
 * Dedicated AI Vision Optical Input Node
 * 
 * Features:
 * - High-throughput MJPEG Streaming (/stream)
 * - Single-frame JPEG snapshot capture (/capture)
 * - Hardware telemetry & status endpoint (/status)
 * - Root diagnostic landing page (/)
 * - Automatic Wi-Fi reconnection handling
 * 
 * Target Board: AI Thinker ESP32-CAM (OV2640)
 * Note: No wearable sensors, motors, or ultrasonic hardware. Visual feed only.
 */

#include "esp_camera.h"
#include <WiFi.h>
#include "esp_timer.h"
#include "img_converters.h"
#include "fb_gfx.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include "esp_http_server.h"

// ═════════════════════════════════════════════════════════════════
// 1. NETWORK CONFIGURATION (Update with your Wi-Fi Credentials)
// ═════════════════════════════════════════════════════════════════
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ═════════════════════════════════════════════════════════════════
// 2. PIN CONFIGURATION: AI THINKER ESP32-CAM
// ═════════════════════════════════════════════════════════════════
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

#define PART_BOUNDARY "123456789000000000000987654321"
static const char* _STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char* _STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";
static const char* _STREAM_PART = "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

httpd_handle_t stream_httpd = NULL;
httpd_handle_t camera_httpd = NULL;

static unsigned long frame_counter = 0;
static framesize_t current_framesize = FRAMESIZE_VGA; // 640x480 default

// ═════════════════════════════════════════════════════════════════
// 3. HTTP HANDLERS
// ═════════════════════════════════════════════════════════════════

// GET / -> Root diagnostic status
static esp_err_t index_handler(httpd_req_t *req) {
    char response[512];
    snprintf(response, sizeof(response),
        "<!DOCTYPE html><html><head><title>VISIONCAP ESP32-CAM</title>"
        "<style>body{background:#060a10;color:#00d4ff;font-family:sans-serif;text-align:center;padding-top:40px;}"
        "h1{font-family:monospace;letter-spacing:2px;color:#fff;} a{color:#8b5cf6;text-decoration:none;font-weight:bold;}"
        ".card{background:#0c1220;display:inline-block;padding:24px 36px;border:1px solid #00d4ff44;border-radius:12px;}"
        "</style></head><body><div class='card'>"
        "<h1>VISIONCAP CAMERA NODE</h1>"
        "<p>Optical Input Feed: ONLINE</p>"
        "<p><a href='/stream'>[ Open Live Stream ]</a> &nbsp;|&nbsp; <a href='/capture'>[ Snapshot Capture ]</a> &nbsp;|&nbsp; <a href='/status'>[ System Telemetry ]</a></p>"
        "</div></body></html>");
    httpd_resp_set_type(req, "text/html");
    return httpd_resp_send(req, response, HTTPD_RESP_USE_STRLEN);
}

// GET /status -> Hardware and stream telemetry (JSON)
static esp_err_t status_handler(httpd_req_t *req) {
    char json_response[256];
    int res_w = 640;
    int res_h = 480;
    if (current_framesize == FRAMESIZE_SVGA) { res_w = 800; res_h = 600; }
    else if (current_framesize == FRAMESIZE_QVGA) { res_w = 320; res_h = 240; }
    else if (current_framesize == FRAMESIZE_HD) { res_w = 1280; res_h = 720; }

    snprintf(json_response, sizeof(json_response),
        "{\"device\":\"VISIONCAP ESP32-CAM\",\"connected\":true,\"resolution\":\"%dx%d\",\"stream\":true,\"frames\":%lu,\"rssi\":%d,\"free_heap\":%u}",
        res_w, res_h, frame_counter, WiFi.RSSI(), ESP.getFreeHeap());

    httpd_resp_set_type(req, "application/json");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    return httpd_resp_send(req, json_response, HTTPD_RESP_USE_STRLEN);
}

// GET /capture -> Single JPEG snapshot
static esp_err_t capture_handler(httpd_req_t *req) {
    camera_fb_t * fb = NULL;
    esp_err_t res = ESP_OK;

    fb = esp_camera_fb_get();
    if (!fb) {
        httpd_resp_send_500(req);
        return ESP_FAIL;
    }

    frame_counter++;
    httpd_resp_set_type(req, "image/jpeg");
    httpd_resp_set_hdr(req, "Content-Disposition", "inline; filename=capture.jpg");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    
    res = httpd_resp_send(req, (const char *)fb->buf, fb->len);
    esp_camera_fb_return(fb);
    return res;
}

// GET /stream -> High-speed MJPEG video feed
static esp_err_t stream_handler(httpd_req_t *req) {
    camera_fb_t * fb = NULL;
    esp_err_t res = ESP_OK;
    size_t _jpg_buf_len = 0;
    uint8_t * _jpg_buf = NULL;
    char * part_buf[64];

    res = httpd_resp_set_type(req, _STREAM_CONTENT_TYPE);
    if (res != ESP_OK) {
        return res;
    }
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");

    while (true) {
        fb = esp_camera_fb_get();
        if (!fb) {
            res = ESP_FAIL;
        } else {
            frame_counter++;
            _jpg_buf_len = fb->len;
            _jpg_buf = fb->buf;
        }

        if (res == ESP_OK) {
            size_t hlen = snprintf((char *)part_buf, 64, _STREAM_PART, _jpg_buf_len);
            res = httpd_resp_send_chunk(req, (const char *)part_buf, hlen);
        }
        if (res == ESP_OK) {
            res = httpd_resp_send_chunk(req, (const char *)_jpg_buf, _jpg_buf_len);
        }
        if (res == ESP_OK) {
            res = httpd_resp_send_chunk(req, _STREAM_BOUNDARY, strlen(_STREAM_BOUNDARY));
        }

        if (fb) {
            esp_camera_fb_return(fb);
            fb = NULL;
            _jpg_buf = NULL;
        } else if (_jpg_buf) {
            free(_jpg_buf);
            _jpg_buf = NULL;
        }

        if (res != ESP_OK) {
            break;
        }
    }
    return res;
}

// ═════════════════════════════════════════════════════════════════
// 4. SERVER INITIALIZATION
// ═════════════════════════════════════════════════════════════════
void startCameraServer() {
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.server_port = 80;
    config.ctrl_port = 32768;

    httpd_uri_t index_uri = {
        .uri       = "/",
        .method    = HTTP_GET,
        .handler   = index_handler,
        .user_ctx  = NULL
    };

    httpd_uri_t status_uri = {
        .uri       = "/status",
        .method    = HTTP_GET,
        .handler   = status_handler,
        .user_ctx  = NULL
    };

    httpd_uri_t capture_uri = {
        .uri       = "/capture",
        .method    = HTTP_GET,
        .handler   = capture_handler,
        .user_ctx  = NULL
    };

    httpd_uri_t stream_uri = {
        .uri       = "/stream",
        .method    = HTTP_GET,
        .handler   = stream_handler,
        .user_ctx  = NULL
    };

    if (httpd_start(&camera_httpd, &config) == ESP_OK) {
        httpd_register_uri_handler(camera_httpd, &index_uri);
        httpd_register_uri_handler(camera_httpd, &status_uri);
        httpd_register_uri_handler(camera_httpd, &capture_uri);
        httpd_register_uri_handler(camera_httpd, &stream_uri);
        Serial.println("[VISIONCAP] HTTP server running on port 80");
    }
}

// ═════════════════════════════════════════════════════════════════
// 5. SETUP & LOOP
// ═════════════════════════════════════════════════════════════════
void setup() {
    // Disable brownout detector to maintain stability during Wi-Fi transmission bursts
    WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);

    Serial.begin(115200);
    Serial.setDebugOutput(true);
    Serial.println("\n[VISIONCAP] Initializing Camera Module...");

    camera_config_t config;
    config.ledc_channel = LEDC_CHANNEL_0;
    config.ledc_timer = LEDC_TIMER_0;
    config.pin_d0 = Y2_GPIO_NUM;
    config.pin_d1 = Y3_GPIO_NUM;
    config.pin_d2 = Y4_GPIO_NUM;
    config.pin_d3 = Y5_GPIO_NUM;
    config.pin_d4 = Y6_GPIO_NUM;
    config.pin_d5 = Y7_GPIO_NUM;
    config.pin_d6 = Y8_GPIO_NUM;
    config.pin_d7 = Y9_GPIO_NUM;
    config.pin_xclk = XCLK_GPIO_NUM;
    config.pin_pclk = PCLK_GPIO_NUM;
    config.pin_vsync = VSYNC_GPIO_NUM;
    config.pin_href = HREF_GPIO_NUM;
    config.pin_sscb_sda = SIOD_GPIO_NUM;
    config.pin_sscb_scl = SIOC_GPIO_NUM;
    config.pin_pwdn = PWDN_GPIO_NUM;
    config.pin_reset = RESET_GPIO_NUM;
    config.xclk_freq_hz = 20000000;
    config.pixel_format = PIXFORMAT_JPEG;

    // PSRAM detection & optimal frame buffer configuration
    if (psramFound()) {
        config.frame_size = FRAMESIZE_VGA; // 640x480
        config.jpeg_quality = 12;          // 0-63 (lower means higher quality)
        config.fb_count = 2;
        config.grab_mode = CAMERA_GRAB_LATEST;
        Serial.println("[VISIONCAP] PSRAM detected. Dual frame buffers allocated.");
    } else {
        config.frame_size = FRAMESIZE_QVGA; // 320x240
        config.jpeg_quality = 15;
        config.fb_count = 1;
        Serial.println("[VISIONCAP] PSRAM not found. Operating in single-buffer mode.");
    }

    current_framesize = config.frame_size;

    // Camera Init
    esp_err_t err = esp_camera_init(&config);
    if (err != ESP_OK) {
        Serial.printf("[VISIONCAP] Camera init failed with error 0x%x\n", err);
        return;
    }

    sensor_t * s = esp_camera_sensor_get();
    if (s != NULL) {
        s->set_brightness(s, 0);     // -2 to 2
        s->set_contrast(s, 0);       // -2 to 2
        s->set_saturation(s, 0);     // -2 to 2
        s->set_special_effect(s, 0); // 0 = No Effect
        s->set_whitebal(s, 1);       // 1 = Enable AWBA
        s->set_awb_gain(s, 1);       // 1 = Enable AWB Gain
        s->set_wb_mode(s, 0);        // 0 = Auto
    }

    // Connect to Wi-Fi
    Serial.printf("[VISIONCAP] Connecting to Wi-Fi SSID: %s\n", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    WiFi.setSleep(false); // Low-latency transmission

    int retry_count = 0;
    while (WiFi.status() != WL_CONNECTED && retry_count < 30) {
        delay(500);
        Serial.print(".");
        retry_count++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n[VISIONCAP] Wi-Fi Connected!");
        Serial.print("[VISIONCAP] IP Address: ");
        Serial.println(WiFi.localIP());
        startCameraServer();
        Serial.println("[VISIONCAP] Ready for backend ingestion.");
    } else {
        Serial.println("\n[VISIONCAP] Wi-Fi connection timed out. Check SSID/Password.");
    }
}

void loop() {
    // Keep Wi-Fi connected if dropped
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[VISIONCAP] Wi-Fi dropped, reconnecting...");
        WiFi.disconnect();
        WiFi.reconnect();
        delay(5000);
    }
    delay(1000);
}
