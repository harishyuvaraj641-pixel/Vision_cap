<p align="center">
  <img src="https://img.shields.io/badge/VISION-CAP-00d4ff?style=for-the-badge&labelColor=030508&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMGQ0ZmYiIHN0cm9rZS13aWR0aD0iMiI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMyIvPjxwYXRoIGQ9Ik0xIDEyYzIuNS01IDYuNS05IDExLTlzOC41IDQgMTEgOS0yLjUgNS02LjUgOS0xMSA5LTguNS00LTExLTlaIi8+PC9zdmc+" alt="VISIONCAP"/>
  <br/><br/>
  <img src="https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Three.js-000000?style=flat-square&logo=three.js&logoColor=white" alt="Three.js"/>
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/ESP32--CAM-E7352C?style=flat-square&logo=espressif&logoColor=white" alt="ESP32"/>
  <img src="https://img.shields.io/badge/OpenAI_Compatible-412991?style=flat-square&logo=openai&logoColor=white" alt="OpenAI"/>
  <img src="https://img.shields.io/badge/Whisper_STT-74aa9c?style=flat-square&logo=openai&logoColor=white" alt="Whisper"/>
  <img src="https://img.shields.io/badge/Edge_TTS-0078D4?style=flat-square&logo=microsoft&logoColor=white" alt="Edge TTS"/>
</p>

<h1 align="center">
  🔮 VISIONCAP
</h1>

<h3 align="center">
  <em>See the world. Ask anything. Hear the answer.</em>
</h3>

<p align="center">
  A voice-first AI vision operating system that helps visually impaired individuals<br/>
  perceive their environment through real-time camera feeds, conversational AI,<br/>
  and spoken feedback — wrapped in a cinematic cyberpunk interface.
</p>

---

## ⚡ One-Click Launch

```bat
start_visioncap.bat
```

> Spawns both the **FastAPI backend** (`localhost:8080`) and the **Vite dev server** (`localhost:3000`), then opens your browser automatically.

---

## 🧠 What It Does

```
    🎤 Voice In          📷 Camera Feed          🔊 Voice Out
        │                      │                      ▲
        ▼                      ▼                      │
  ┌──────────┐         ┌──────────────┐        ┌──────────┐
  │ Whisper   │         │ Frame Buffer │        │ Edge TTS │
  │   STT    │         │  (Latest-1)  │        │ Synthesis │
  └────┬─────┘         └──────┬───────┘        └────▲─────┘
       │                      │                     │
       └──────────┬───────────┘                     │
                  ▼                                 │
         ┌────────────────┐                         │
         │   Vision AI    │─────────────────────────┘
         │  GPT-4o/Groq   │
         │  + Scene Frame  │
         └────────────────┘
```

**You speak → Camera captures → AI sees & reasons → You hear the answer.**

---

## ✨ Feature Highlights

| Feature | Description |
|---------|-------------|
| 🌌 **Holographic Neural Core** | Three.js particle simulations — Neural Brain, Singularity, Quantum Knot, and BioCapsid modes — that react to AI cognitive states |
| 🎬 **Cinematic Boot Sequence** | Stage-by-stage system initialization with progress bars and sci-fi aesthetics |
| 📹 **Multi-Camera Workspace** | ESP32-CAM, USB, Laptop, IP cameras — switch between Primary View, 2×2 Grid, and Split Screen |
| 🔬 **Decoding HUD Visualizer** | Step-by-step visual breakdown: `Frame Captured → Image Scan → Feature Extraction → Scene Understanding → AI Reasoning → Spoken Response` |
| 🎙️ **Dual Audio Control** | Independent input/output device selection with real-time audio meters |
| 🌐 **Bilingual Support** | English ↔ Tamil language toggle with intelligent script detection |
| ♿ **Full Accessibility** | High Contrast, Large Text, Reduced Motion, Screen Reader labels, keyboard-first navigation |
| 🎮 **Interactive Demo Mode** | Full end-to-end simulation without any hardware connected |
| 🔒 **Privacy-First** | Ephemeral frame buffer — no video/audio is ever written to disk |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     VISIONCAP SYSTEM                         │
├──────────────────────┬──────────────────────────────────────┤
│                      │                                      │
│  ┌────────────────┐  │  ┌────────────────────────────────┐  │
│  │  REACT FRONTEND│  │  │       FASTAPI BACKEND          │  │
│  │                │  │  │                                │  │
│  │  • Dashboard   │  │  │  API Routes:                   │  │
│  │  • Camera HUD  │◄─┼──│  /api/camera/*  Camera mgmt    │  │
│  │  • AI Core Viz │  │  │  /api/voice/*   STT control    │  │
│  │  • Audio Panel │  │  │  /api/vision/*  AI analysis    │  │
│  │  • Conversation│  │  │  /api/tts/*     Speech output  │  │
│  │  • Settings    │  │  │  /ws            Live events    │  │
│  │                │  │  │                                │  │
│  │  Three.js Orb  │  │  │  Services:                     │  │
│  │  WebSocket Bus │  │  │  • CameraService (multi-cam)   │  │
│  │  CSS Modules   │  │  │  • VisionService (AI pipeline) │  │
│  └────────────────┘  │  │  • SpeechService (Whisper)     │  │
│                      │  │  • TTSService (Edge-TTS)       │  │
│  Port: 3000 (Vite)   │  │  • EventService (WebSocket)    │  │
│                      │  │  • ConversationService         │  │
│                      │  │                                │  │
│                      │  │  Providers:                     │  │
│                      │  │  • OpenAI Compatible            │  │
│                      │  │  • Groq                         │  │
│                      │  │                                │  │
│                      │  │  Port: 8080 (Uvicorn)           │  │
│                      │  └────────────────────────────────┘  │
├──────────────────────┴──────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │               HARDWARE LAYER                         │   │
│  │  ESP32-CAM  •  USB Webcam  •  Laptop Camera  •  IP  │   │
│  │  AirPods Mic  •  USB Mic  •  Speakers/Headphones    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Manual Setup

### Prerequisites

| Tool | Version |
|------|---------|
| **Node.js** | ≥ 18.0 |
| **Python** | ≥ 3.10 |
| **ESP32-CAM** | Optional (Demo Mode works without it) |

### Frontend

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# → http://localhost:3000
```

### Backend

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux

# Start the server
python run.py
# → http://localhost:8080
# → Swagger docs at http://localhost:8080/docs
```

### ESP32-CAM Firmware

1. Open `esp32cam/esp32cam.ino` in **Arduino IDE**
2. Board: **AI Thinker ESP32-CAM**
3. Partition: **Huge APP (3MB No OTA / 1MB SPIFFS)**
4. Update Wi-Fi credentials in the sketch
5. Flash with GPIO 0 → GND, then reset and check Serial Monitor for the IP

---

## ⚙️ Configuration

Edit `backend/.env` with your settings:

```ini
# AI Provider (OpenAI, Groq, OpenRouter, or any compatible API)
AI_PROVIDER=openai_compatible
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=your-api-key
AI_MODEL=gpt-4o

# ESP32-CAM
ESP32_CAM_URL=http://192.168.1.100

# Speech Recognition
WHISPER_MODEL=base

# Text-to-Speech
TTS_VOICE=en-US-GuyNeural
```

---

## 🔌 API Reference

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | System health check |
| `GET` | `/api/system/status` | All subsystem statuses |
| `GET` | `/api/camera/status` | Camera telemetry |
| `GET` | `/api/camera/frame` | Latest JPEG frame |
| `GET` | `/api/camera/stream` | Proxied MJPEG stream |
| `POST` | `/api/camera/add` | Register new camera |
| `DELETE` | `/api/camera/{id}` | Remove camera |
| `PUT` | `/api/camera/{id}/primary` | Set primary camera |
| `POST` | `/api/voice/start` | Start recording |
| `POST` | `/api/voice/stop` | Stop & transcribe |
| `POST` | `/api/vision/ask` | Send question + frame to AI |
| `POST` | `/api/tts/stop` | Interrupt playback |
| `GET` | `/api/conversation/history` | Get conversation |
| `DELETE` | `/api/conversation/history` | Clear conversation |

### WebSocket (`/ws`)

Real-time event stream with types: `system_state`, `camera_status`, `frame_captured`, `analysis_started`, `analysis_progress`, `ai_response`, `tts_started`, `tts_finished`

---

## 🎨 Design System

| Element | Value |
|---------|-------|
| **Background** | `#030508` — Deep graphite |
| **Primary Accent** | `#00d4ff` — Electric cyan |
| **AI Highlight** | `#8b5cf6` — Neural violet |
| **Success** | `#10b981` — Emerald |
| **Danger** | `#ef4444` — Red alert |
| **Heading Font** | `Orbitron` |
| **Body Font** | `Inter` |
| **Code Font** | `JetBrains Mono` |
| **Glass Effect** | `backdrop-filter: blur(20px)` + translucent borders |

---

## 🧪 Testing

```bash
python backend/tests/run_tests.py
```

Covers: Frame buffer isolation, multi-camera lifecycle, AI provider config, conversation memory bounds, state machine transitions, REST API validation, and error handling.

---

## 🔐 Privacy

- **No persistent storage** — Video stays in memory as a single latest frame
- **On-demand only** — Frames are sent to AI only when you ask a question
- **Local secrets** — API keys live in `.env` on your machine, never exposed to the browser

---

## 📁 Project Structure

```
visioncap/
├── src/                    # React frontend
│   ├── components/
│   │   ├── ai/             # Neural core, holographic visualizer
│   │   ├── audio/          # Audio meters, device selectors
│   │   ├── camera/         # Camera cards, grid, HUD, workspace
│   │   ├── conversation/   # Chat panel, visual context
│   │   ├── layout/         # Boot sequence, top bar, status bar
│   │   ├── settings/       # AI, camera, audio, accessibility
│   │   └── system/         # Demo mode, system indicators
│   ├── hooks/              # React hooks for state management
│   ├── services/           # API clients, WebSocket, mock services
│   └── styles/             # Global CSS, animations, variables
├── backend/                # FastAPI backend
│   ├── app/
│   │   ├── api/            # Route handlers
│   │   ├── core/           # State machine, exceptions, logging
│   │   ├── models/         # Pydantic schemas
│   │   ├── providers/      # AI provider abstraction layer
│   │   ├── services/       # Business logic services
│   │   └── utils/          # Helpers
│   └── tests/              # Automated test suite
├── esp32cam/               # Arduino firmware for ESP32-CAM
├── index.html              # Vite entry point
├── vite.config.js          # Vite configuration
├── package.json            # Node dependencies
└── start_visioncap.bat     # One-click launcher (Windows)
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License — Built for the **VISIONCAP** Project.

---

<p align="center">
  <sub>Empowering vision through voice, AI, and real-time perception.</sub>
</p>
