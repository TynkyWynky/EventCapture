/**
 * Drink Detection AI - Frontend Application
 * Handles webcam capture, WebSocket streaming, and UI updates.
 */

class DrinkDetectionApp {
    constructor() {
        // Elements
        this.webcam = document.getElementById('webcam');
        this.captureCanvas = document.getElementById('captureCanvas');
        this.overlayCanvas = document.getElementById('overlayCanvas');
        this.resultFrame = document.getElementById('resultFrame');
        this.noCamera = document.getElementById('noCamera');
        this.btnStart = document.getElementById('btnStart');
        this.btnStop = document.getElementById('btnStop');
        this.btnUpload = document.getElementById('btnUpload');
        this.fileInput = document.getElementById('fileInput');
        this.confThreshold = document.getElementById('confThreshold');
        this.confValue = document.getElementById('confValue');
        this.frameRateSelect = document.getElementById('frameRate');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.fpsDisplay = document.getElementById('fpsDisplay');
        this.detectionsList = document.getElementById('detectionsList');
        this.drinkingAlert = document.getElementById('drinkingAlert');
        this.drinkingInfo = document.getElementById('drinkingInfo');
        this.detectionLog = document.getElementById('detectionLog');

        // State
        this.ws = null;
        this.stream = null;
        this.captureInterval = null;
        this.isRunning = false;
        this.waitingForResponse = false;
        this.logEntries = [];
        this.latestAnnotatedImage = null;

        this.init();
    }

    init() {
        this.btnStart.addEventListener('click', () => this.start());
        this.btnStop.addEventListener('click', () => this.stop());
        this.btnUpload.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleUpload(e));
        this.confThreshold.addEventListener('input', () => {
            this.confValue.textContent = this.confThreshold.value + '%';
        });
    }

    async start() {
        try {
            this.btnStart.disabled = true;
            this.setConnectionStatus('connecting');

            // Request camera
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            });
            this.webcam.srcObject = this.stream;
            this.webcam.style.display = 'block';
            this.overlayCanvas.style.display = 'block';
            this.resultFrame.style.display = 'none';
            this.noCamera.style.display = 'none';

            // Wait for video to actually start playing
            await new Promise(resolve => {
                this.webcam.onloadeddata = resolve;
            });

            // Connect WebSocket
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const token = this.getAccessToken();
            const wsQuery = token ? `?token=${encodeURIComponent(token)}` : '';
            const wsUrl = `${protocol}//${window.location.host}/ws/detect${wsQuery}`;
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                this.setConnectionStatus('connected');
                this.isRunning = true;
                this.btnStop.disabled = false;
                this.startCapture();
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'detection') {
                    this.latestAnnotatedImage = data.frame || null;
                    this.handleDetectionResult(data);
                    // Send next frame now that we got a response
                    this.waitingForResponse = false;
                    const ctx = this.captureCanvas.getContext('2d');
                    requestAnimationFrame(() => this.sendNextFrame(ctx));
                }
            };

            this.ws.onclose = () => {
                this.setConnectionStatus('disconnected');
                if (this.isRunning) this.stop();
            };

            this.ws.onerror = (err) => {
                console.error('WebSocket error:', err);
                this.setConnectionStatus('disconnected');
            };

        } catch (err) {
            console.error('Failed to start:', err);
            this.btnStart.disabled = false;
            alert('Could not access camera. Please allow camera permissions.');
        }
    }

    stop() {
        this.isRunning = false;

        if (this.captureInterval) {
            clearInterval(this.captureInterval);
            this.captureInterval = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        this.webcam.style.display = 'none';
        this.overlayCanvas.style.display = 'none';
        this.resultFrame.style.display = 'none';
        this.noCamera.style.display = 'block';
        this.btnStart.disabled = false;
        this.btnStop.disabled = true;
        this.setConnectionStatus('disconnected');
        this.fpsDisplay.textContent = '0';
    }

    startCapture() {
        const ctx = this.captureCanvas.getContext('2d');
        this.waitingForResponse = false;
        this.sendNextFrame(ctx);
    }

    sendNextFrame(ctx) {
        if (!this.isRunning || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        if (this.waitingForResponse) return;

        this.captureCanvas.width = this.webcam.videoWidth || 640;
        this.captureCanvas.height = this.webcam.videoHeight || 480;
        ctx.drawImage(this.webcam, 0, 0);

        const frameData = this.captureCanvas.toDataURL('image/jpeg', 0.7);
        const confThreshold = parseInt(this.confThreshold.value) / 100;

        this.ws.send(JSON.stringify({
            type: 'frame',
            data: frameData,
            conf_threshold: confThreshold,
        }));
        this.waitingForResponse = true;
    }

    handleDetectionResult(data) {
        // Draw bounding boxes on overlay canvas (webcam stays live)
        this.drawDetections(data.detections, data.debug || { persons: [], head_zones: [], faces: [] });

        // Update FPS
        this.fpsDisplay.textContent = data.fps || '0';

        // Update detections list
        this.updateDetectionsList(data.detections);

        // Handle drinking detection
        if (data.drinking_detected) {
            this.showDrinkingAlert(data.detections);
        } else {
            this.drinkingAlert.style.display = 'none';
        }

        // Log new detections
        if (data.detections.length > 0) {
            this.addLogEntries(data.detections);
        }
    }

    drawDetections(detections, debug) {
        const vw = this.webcam.videoWidth || 640;
        const vh = this.webcam.videoHeight || 480;
        this.overlayCanvas.width = vw;
        this.overlayCanvas.height = vh;
        const ctx = this.overlayCanvas.getContext('2d');
        ctx.clearRect(0, 0, vw, vh);
        ctx.font = 'bold 16px sans-serif';
        ctx.textBaseline = 'top';

        const debugLines = [
            `Faces: ${(debug.faces || []).length}`,
            `Head: ${(debug.head_zones || []).length}`,
            `Drinks: ${detections.length}`,
        ];

        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(10, 10, 170, 70);
        ctx.fillStyle = '#ffffff';
        debugLines.forEach((line, index) => {
            ctx.fillText(line, 18, 18 + index * 18);
        });

        for (const face of debug.faces || []) {
            const [x1, y1, x2, y2] = face;
            ctx.strokeStyle = '#ff5a5f';
            ctx.lineWidth = 3;
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            ctx.fillStyle = '#ff5a5f';
            ctx.fillRect(x1, Math.max(0, y1 - 24), 56, 24);
            ctx.fillStyle = '#000000';
            ctx.fillText('FACE', x1 + 6, Math.max(2, y1 - 22));
        }

        for (const head of debug.head_zones || []) {
            const [x1, y1, x2, y2] = head;
            ctx.strokeStyle = '#ffd166';
            ctx.lineWidth = 3;
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            ctx.fillStyle = '#ffd166';
            ctx.fillRect(x1, Math.max(0, y1 - 24), 70, 24);
            ctx.fillStyle = '#000000';
            ctx.fillText('HEAD', x1 + 6, Math.max(2, y1 - 22));
        }

        for (const d of detections) {
            const [x1, y1, x2, y2] = d.bbox;
            const w = x2 - x1;
            const h = y2 - y1;

            const color = d.is_drinking ? '#ff9100' : '#00d4ff';

            ctx.strokeStyle = color;
            ctx.lineWidth = 4;
            if (Array.isArray(d.rotated_bbox) && d.rotated_bbox.length === 4) {
                ctx.beginPath();
                d.rotated_bbox.forEach(([px, py], index) => {
                    if (index === 0) {
                        ctx.moveTo(px, py);
                    } else {
                        ctx.lineTo(px, py);
                    }
                });
                ctx.closePath();
                ctx.stroke();
            } else {
                ctx.strokeRect(x1, y1, w, h);
            }

            // Label background
            const angleText = typeof d.rotation_degrees === 'number'
                ? ` ${Math.round(d.rotation_degrees)}deg`
                : '';
            const label = `${d.drink_type} ${(d.confidence * 100).toFixed(0)}%${angleText}`;
            ctx.font = 'bold 14px sans-serif';
            const textW = ctx.measureText(label).width + 8;
            ctx.fillStyle = color;
            ctx.fillRect(x1, y1 - 22, textW, 22);

            // Label text
            ctx.fillStyle = '#000';
            ctx.fillText(label, x1 + 4, y1 - 6);
        }
    }

    updateDetectionsList(detections) {
        if (detections.length === 0) {
            this.detectionsList.innerHTML = '<p class="empty-state">No drinks detected</p>';
            return;
        }

        this.detectionsList.innerHTML = detections.map(d => `
            <div class="detection-item ${d.is_drinking ? 'drinking' : ''}">
                <div>
                    <div class="drink-name">${this.escapeHtml(d.drink_type)}</div>
                    <div class="drink-conf">${d.label} · ${(d.confidence * 100).toFixed(0)}%</div>
                </div>
                ${d.is_drinking ? '<span style="color: var(--warning); font-weight: bold;">DRINKING</span>' : ''}
            </div>
        `).join('');
    }

    showDrinkingAlert(detections) {
        const drinkingItems = detections.filter(d => d.is_drinking);
        this.drinkingAlert.style.display = 'block';
        this.drinkingInfo.textContent = drinkingItems
            .map(d => `${d.drink_type} (${(d.confidence * 100).toFixed(0)}%)`)
            .join(', ');
    }

    addLogEntries(detections) {
        const time = new Date().toLocaleTimeString();
        for (const d of detections) {
            const entry = `<div class="log-entry"><span class="time">${this.escapeHtml(time)}</span>${this.escapeHtml(d.drink_type)} ${d.is_drinking ? '(drinking)' : ''}</div>`;
            this.logEntries.unshift(entry);
        }

        // Keep only last 50 entries
        this.logEntries = this.logEntries.slice(0, 50);
        this.detectionLog.innerHTML = this.logEntries.join('');
    }

    async handleUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        const headers = {};
        const token = this.getAccessToken();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        try {
            const response = await fetch('/api/detect', {
                method: 'POST',
                headers,
                body: formData,
            });

            const data = await response.json();
            if (data.error) {
                alert(data.error);
                return;
            }

            // Show result
            this.resultFrame.src = data.annotated_image;
            this.resultFrame.style.display = 'block';
            this.webcam.style.display = 'none';
            this.overlayCanvas.style.display = 'none';
            this.noCamera.style.display = 'none';

            this.updateDetectionsList(data.detections);

            if (data.detections.some(d => d.is_drinking)) {
                this.showDrinkingAlert(data.detections);
            }

            this.addLogEntries(data.detections);

        } catch (err) {
            console.error('Upload failed:', err);
            alert('Failed to analyze image. Is the server running?');
        }

        // Reset file input
        this.fileInput.value = '';
    }

    setConnectionStatus(status) {
        this.connectionStatus.className = `status ${status}`;
        const labels = { connected: 'Connected', disconnected: 'Disconnected', connecting: 'Connecting...' };
        this.connectionStatus.textContent = labels[status] || status;
    }

    getAccessToken() {
        const params = new URLSearchParams(window.location.search);
        const fromQuery = params.get('token');
        if (fromQuery && fromQuery.trim()) {
            return fromQuery.trim();
        }

        const fromStorage = window.localStorage.getItem('eventcapture_access_token');
        return fromStorage && fromStorage.trim() ? fromStorage.trim() : '';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new DrinkDetectionApp();
});
