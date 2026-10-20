import base64

try:
    import numpy as np
    import cv2
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False

def encode_frame_base64(jpeg_data: bytes) -> str:
    return base64.b64encode(jpeg_data).decode('utf-8')

def resize_frame(frame, max_w: int, max_h: int):
    if not HAS_CV2:
        return frame
        
    h, w = frame.shape[:2]
    if w <= max_w and h <= max_h:
        return frame
        
    scale = min(max_w/w, max_h/h)
    new_w = int(w * scale)
    new_h = int(h * scale)
    
    return cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_AREA)

def validate_jpeg(data: bytes) -> bool:
    if not data or len(data) < 2:
        return False
    # Check JPEG markers SOI (FFD8) and EOI (FFD9)
    # Some incomplete streams might not have EOI, but must have SOI
    return data.startswith(b'\xff\xd8')
