/* ═══════════════════════════════════════════════════════
   VISIONCAP — Comprehensive Mock Data (Clearly labeled DEMO)
   ═══════════════════════════════════════════════════════ */

export const DEMO_LABEL = 'DEMO';

export const MOCK_CAMERAS = [
  {
    id: 'cam-001',
    name: 'CAM 01',
    label: 'ESP32-CAM Front',
    type: 'esp32cam',
    url: 'http://192.168.1.100',
    streamUrl: '/stream',
    captureUrl: '/capture',
    status: 'live',
    resolution: '640×480',
    fps: 24.5,
    isPrimary: true,
    isDemo: true,
  },
  {
    id: 'cam-002',
    name: 'CAM 02',
    label: 'ESP32-CAM Side',
    type: 'esp32cam',
    url: 'http://192.168.1.101',
    streamUrl: '/stream',
    captureUrl: '/capture',
    status: 'live',
    resolution: '640×480',
    fps: 22.0,
    isPrimary: false,
    isDemo: true,
  },
  {
    id: 'cam-003',
    name: 'CAM 03',
    label: 'Laptop Camera',
    type: 'laptop',
    url: '',
    streamUrl: '',
    captureUrl: '',
    status: 'ready',
    resolution: '1280×720',
    fps: 30.0,
    isPrimary: false,
    isDemo: true,
  },
];

export const MOCK_AUDIO_INPUTS = [
  { id: 'mic-001', name: 'AirPods Microphone', label: 'AirPods Microphone', type: 'bluetooth', status: 'connected', isDemo: true },
  { id: 'mic-002', name: 'Laptop Microphone', label: 'Laptop Microphone', type: 'builtin', status: 'available', isDemo: true },
  { id: 'mic-003', name: 'USB Microphone', label: 'USB Microphone', type: 'usb', status: 'available', isDemo: true },
];

export const MOCK_AUDIO_OUTPUTS = [
  { id: 'out-001', name: 'AirPods', label: 'AirPods', type: 'bluetooth', status: 'connected', isDemo: true },
  { id: 'out-002', name: 'Laptop Speakers', label: 'Laptop Speakers', type: 'builtin', status: 'available', isDemo: true },
  { id: 'out-003', name: 'Bluetooth Speaker', label: 'Bluetooth Speaker', type: 'bluetooth', status: 'disconnected', isDemo: true },
];

export const MOCK_CONVERSATION = [
  {
    id: 'msg-001',
    role: 'user',
    text: 'What do you see in front of me?',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    isDemo: true,
  },
  {
    id: 'msg-002',
    role: 'assistant',
    text: 'I can see a laptop, a water bottle, and a notebook on the table in front of you.',
    timestamp: new Date(Date.now() - 115000).toISOString(),
    frameId: 4291,
    cameraId: 'cam-001',
    isDemo: true,
  },
  {
    id: 'msg-003',
    role: 'user',
    text: 'What color is the bottle?',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    isDemo: true,
  },
  {
    id: 'msg-004',
    role: 'assistant',
    text: 'The bottle appears to be blue, positioned to the right of your laptop.',
    timestamp: new Date(Date.now() - 55000).toISOString(),
    frameId: 4305,
    cameraId: 'cam-001',
    isDemo: true,
  },
];

export const AI_STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  TRANSCRIBING: 'transcribing',
  CAPTURED: 'captured',
  DECODING: 'decoding',
  ANALYZING: 'analyzing',
  THINKING: 'thinking',
  SPEAKING: 'speaking',
  PROCESSING: 'decoding',
  RESPONDING: 'speaking',
  ERROR: 'error',
  OFFLINE: 'offline',
};

export const AI_STATE_LABELS = {
  idle: 'VISIONCAP READY',
  IDLE: 'VISIONCAP READY',
  listening: 'LISTENING...',
  LISTENING: 'LISTENING...',
  transcribing: 'TRANSCRIBING...',
  TRANSCRIBING: 'TRANSCRIBING...',
  captured: 'FRAME CAPTURED',
  CAPTURED: 'FRAME CAPTURED',
  decoding: 'DECODING VISUAL INPUT',
  DECODING: 'DECODING VISUAL INPUT',
  analyzing: 'ANALYZING SCENE',
  ANALYZING: 'ANALYZING SCENE',
  thinking: 'AI REASONING',
  THINKING: 'AI REASONING',
  speaking: 'VISIONCAP SPEAKING',
  SPEAKING: 'VISIONCAP SPEAKING',
  processing: 'PROCESSING',
  PROCESSING: 'PROCESSING',
  responding: 'SPEAKING',
  RESPONDING: 'SPEAKING',
  error: 'SYSTEM FAULT',
  ERROR: 'SYSTEM FAULT',
  offline: 'OFFLINE',
  OFFLINE: 'OFFLINE',
};

export const CAMERA_TYPES = [
  { value: 'esp32cam', label: 'ESP32-CAM' },
  { value: 'usb', label: 'USB Camera' },
  { value: 'laptop', label: 'Laptop Camera' },
  { value: 'network', label: 'Network Camera' },
  { value: 'custom', label: 'Custom Stream' },
];

export const CAMERA_STATUSES = {
  LIVE: 'live',
  READY: 'ready',
  CONNECTING: 'connecting',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
};

export const DECODING_STAGES = [
  { id: 'frame_captured', label: 'FRAME CAPTURED', text: 'FRAME CAPTURED', duration: 600 },
  { id: 'image_scan', label: 'IMAGE SCAN', text: 'IMAGE SCAN', duration: 800 },
  { id: 'feature_extraction', label: 'FEATURE EXTRACTION', text: 'FEATURE EXTRACTION', duration: 1000 },
  { id: 'scene_understanding', label: 'SCENE UNDERSTANDING', text: 'SCENE UNDERSTANDING', duration: 1200 },
  { id: 'ai_reasoning', label: 'AI REASONING', text: 'AI REASONING', duration: 1500 },
  { id: 'response_ready', label: 'RESPONSE READY', text: 'RESPONSE READY', duration: 400 },
];

export const BOOT_STAGES = [
  { id: 'init', label: 'INITIALIZING VISION CORE', duration: 800 },
  { id: 'camera', label: 'LOADING CAMERA INTERFACE', duration: 600 },
  { id: 'audio', label: 'LOADING AUDIO SYSTEM', duration: 500 },
  { id: 'ai', label: 'INITIALIZING AI CORE', duration: 700 },
  { id: 'ready', label: 'SYSTEM READY', duration: 400 },
];

export const DEMO_WORKFLOW = [
  { type: 'ai_state', state: 'idle', delay: 300 },
  { type: 'ai_state', state: 'listening', delay: 1000 },
  { type: 'user', text: 'What is in front of me?', delay: 1500 },
  { type: 'ai_state', state: 'captured', delay: 600 },
  { type: 'ai_state', state: 'decoding', delay: 1200 },
  { type: 'ai_state', state: 'analyzing', delay: 1200 },
  { type: 'ai_state', state: 'thinking', delay: 1000 },
  { type: 'assistant', text: 'I see a laptop, a coffee mug, and a pair of eyeglasses on the wooden desk right in front of you.', delay: 800 },
  { type: 'ai_state', state: 'speaking', delay: 2500 },
  { type: 'ai_state', state: 'idle', delay: 1000 }
];
