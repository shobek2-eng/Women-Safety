/**
 * SafeHer Camera Evidence & Audio Recording Service
 * Provides centralized front-facing camera streaming and rolling video buffer
 * for both the Picture-in-Picture map preview and the Anti-Denial Evidence Drawer.
 */

export interface CameraServiceState {
  stream: MediaStream | null;
  hasPermission: boolean | null;
  cameraError: string | null;
  isRecording: boolean;
  recordingSeconds: number;
  facingMode: 'user' | 'environment';
  audioLevel: number; // 0 to 100
}

type Listener = (state: CameraServiceState) => void;

class CameraEvidenceService {
  private stream: MediaStream | null = null;
  private hasPermission: boolean | null = null;
  private cameraError: string | null = null;
  private isRecording: boolean = false;
  private recordingSeconds: number = 0;
  private facingMode: 'user' | 'environment' = 'user';
  private audioLevel: number = 0;

  private listeners: Set<Listener> = new Set();
  private mediaRecorder: MediaRecorder | null = null;
  private recordedBlobs: Blob[] = [];
  private timerInterval: any = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioAnimFrame: number | null = null;

  getState(): CameraServiceState {
    return {
      stream: this.stream,
      hasPermission: this.hasPermission,
      cameraError: this.cameraError,
      isRecording: this.isRecording,
      recordingSeconds: this.recordingSeconds,
      facingMode: this.facingMode,
      audioLevel: this.audioLevel,
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  async startCapture(facing: 'user' | 'environment' = 'user'): Promise<MediaStream | null> {
    this.facingMode = facing;
    this.cameraError = null;
    this.notify();

    if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.hasPermission = false;
      this.cameraError = 'MediaDevices API not supported on this browser platform.';
      this.notify();
      return null;
    }

    try {
      // Stop previous tracks if switching
      if (this.stream) {
        this.stream.getTracks().forEach((t) => t.stop());
      }
      this.stopAudioMeter();

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: this.facingMode },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: true,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.stream = newStream;
      this.hasPermission = true;
      this.cameraError = null;
      this.isRecording = true;

      // Start Audio Meter to confirm live microphone input
      this.initAudioMeter(newStream);

      // Start continuous rolling video recording
      this.initMediaRecorder(newStream);

      // Start duration timer if not running
      if (!this.timerInterval) {
        this.timerInterval = setInterval(() => {
          this.recordingSeconds += 1;
          this.notify();
        }, 1000);
      }

      this.notify();
      return newStream;
    } catch (err: any) {
      console.warn('CameraEvidenceService capture failed:', err);
      this.hasPermission = false;
      this.cameraError = err.message || 'Camera permission denied or camera unavailable.';
      this.stream = null;
      this.notify();
      return null;
    }
  }

  private initMediaRecorder(stream: MediaStream) {
    if (typeof MediaRecorder === 'undefined') return;

    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }

      let mimeType = 'video/webm';
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
        mimeType = 'video/webm;codecs=vp9,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        mimeType = 'video/webm;codecs=vp8,opus';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedBlobs.push(event.data);
          // Retain latest 180 chunks (~3 minutes of rolling high-priority video)
          if (this.recordedBlobs.length > 180) {
            this.recordedBlobs.shift();
          }
        }
      };
      recorder.start(1000);
      this.mediaRecorder = recorder;
    } catch (e) {
      console.warn('Failed to start MediaRecorder:', e);
    }
  }

  private initAudioMeter(stream: MediaStream) {
    try {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        // Normalize roughly to 0-100
        const level = Math.min(100, Math.round((avg / 128) * 100));
        if (Math.abs(level - this.audioLevel) > 2) {
          this.audioLevel = level;
          this.notify();
        }

        this.audioAnimFrame = requestAnimationFrame(updateMeter);
      };

      this.audioAnimFrame = requestAnimationFrame(updateMeter);
    } catch (e) {
      console.warn('Audio meter initialization warning:', e);
    }
  }

  private stopAudioMeter() {
    if (this.audioAnimFrame) {
      cancelAnimationFrame(this.audioAnimFrame);
      this.audioAnimFrame = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }
    this.analyser = null;
    this.audioLevel = 0;
  }

  async switchCamera(): Promise<void> {
    const nextFacing = this.facingMode === 'user' ? 'environment' : 'user';
    await this.startCapture(nextFacing);
  }

  getRecordedBlobs(): Blob[] {
    return [...this.recordedBlobs];
  }

  stopCapture() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {}
      this.mediaRecorder = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.stopAudioMeter();

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.isRecording = false;
    this.recordingSeconds = 0;
    this.hasPermission = null;
    this.cameraError = null;
    this.notify();
  }
}

export const cameraEvidenceService = new CameraEvidenceService();
