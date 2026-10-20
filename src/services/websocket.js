class VisionCapSocket {
    constructor() {
        this.url = null;
        this.socket = null;
        this.listeners = new Map();
        this.mockMode = false;
        this.connected = false;
    }

    connect(url, mockMode = false) {
        this.url = url;
        this.mockMode = mockMode;
        
        if (this.mockMode) {
            this.connected = true;
            this.trigger('system_status', { status: 'connected' });
            return Promise.resolve();
        }

        this.shouldReconnect = true;
        this.reconnectTimer = null;

        return new Promise((resolve, reject) => {
            try {
                this.socket = new WebSocket(url);
                
                this.socket.onopen = () => {
                    this.connected = true;
                    this.trigger('system_status', { status: 'connected' });
                    resolve();
                };

                this.socket.onclose = () => {
                    this.connected = false;
                    this.trigger('system_status', { status: 'disconnected' });
                    if (this.shouldReconnect) {
                        clearTimeout(this.reconnectTimer);
                        this.reconnectTimer = setTimeout(() => {
                            if (this.url && !this.connected) {
                                this.connect(this.url).catch(() => {});
                            }
                        }, 3000);
                    }
                };

                this.socket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        const payload = data.payload !== undefined ? data.payload : data.data;
                        this.trigger(data.type, payload);
                    } catch (e) {
                        this.trigger('error', e);
                    }
                };

                this.socket.onerror = (error) => {
                    this.trigger('error', error);
                    reject(error);
                };
            } catch (e) {
                reject(e);
            }
        });
    }

    disconnect() {
        this.shouldReconnect = false;
        clearTimeout(this.reconnectTimer);
        if (this.mockMode) {
            this.connected = false;
            this.trigger('system_status', { status: 'disconnected' });
            return;
        }

        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.connected = false;
    }

    on(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType).add(callback);
    }

    off(eventType, callback) {
        if (this.listeners.has(eventType)) {
            this.listeners.get(eventType).delete(callback);
        }
    }

    trigger(eventType, data) {
        if (this.listeners.has(eventType)) {
            for (const callback of this.listeners.get(eventType)) {
                callback(data);
            }
        }
    }

    send(type, data) {
        if (this.mockMode) {
            // Simulate receiving an echo or response if needed, 
            // but normally just simulate the send logic.
            setTimeout(() => {
                // mock response logic can be added here if needed
                console.log(`[Mock WS] Sent ${type}`, data);
            }, 50);
            return;
        }

        if (this.socket && this.connected) {
            this.socket.send(JSON.stringify({ type, payload: data }));
        }
    }

    isConnected() {
        return this.connected;
    }
}

export const websocketInstance = new VisionCapSocket();
export default websocketInstance;
