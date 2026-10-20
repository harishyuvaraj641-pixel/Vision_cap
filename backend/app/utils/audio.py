try:
    import sounddevice
    HAS_SOUNDDEVICE = True
except ImportError:
    HAS_SOUNDDEVICE = False

def get_input_devices() -> list[dict]:
    if not HAS_SOUNDDEVICE:
        return []
        
    devices = sounddevice.query_devices()
    inputs = []
    
    for idx, dev in enumerate(devices):
        if dev.get('max_input_channels', 0) > 0:
            inputs.append({
                "id": idx,
                "name": dev.get('name'),
                "channels": dev.get('max_input_channels')
            })
            
    return inputs

def get_output_devices() -> list[dict]:
    if not HAS_SOUNDDEVICE:
        return []
        
    devices = sounddevice.query_devices()
    outputs = []
    
    for idx, dev in enumerate(devices):
        if dev.get('max_output_channels', 0) > 0:
            outputs.append({
                "id": idx,
                "name": dev.get('name'),
                "channels": dev.get('max_output_channels')
            })
            
    return outputs
