// Voice Trigger Service for "RAPE" -> "RAPE" -> "RAPE"
// Provides automated speech recognition with sliding window counter & instant test triggers.

type VoiceCallback = (count: number, transcript: string) => void;
type TriggerCallback = () => void;
type StatusCallback = (active: boolean, message?: string) => void;

class VoiceTriggerService {
  private recognition: any = null;
  private isListening = false;
  private matchCount = 0;
  private lastMatchTime = 0;
  private resetTimeout: any = null;
  private onWordCallbacks: VoiceCallback[] = [];
  private onTriggerCallbacks: TriggerCallback[] = [];
  private onStatusCallbacks: StatusCallback[] = [];

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not natively supported on this browser. Simulated voice triggers available.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        const results = event.results;
        for (let i = event.resultIndex; i < results.length; i++) {
          const transcript = results[i][0].transcript.trim().toLowerCase();
          this.processTranscript(transcript);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          this.isListening = false;
          this.notifyStatus(false, 'Microphone permission required for voice trigger.');
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch (e) {
            // Already started or suspended
          }
        }
      };
    } catch (e) {
      console.warn('Failed to initialize SpeechRecognition:', e);
    }
  }

  public processTranscript(text: string) {
    // Check for target emergency trigger words: "rape", "bachao" (Hindi/India distress), "help", or "police"
    const cleaned = text.toLowerCase();
    const regex = /\b(rape|bachao|help|police)\b/g;
    const matches = cleaned.match(regex);

    if (matches && matches.length > 0) {
      for (let i = 0; i < matches.length; i++) {
        this.registerKeywordDetection(matches[i]);
      }
    }
  }

  public registerKeywordDetection(word: string = 'rape') {
    const now = Date.now();
    // If more than 12 seconds passed since previous word, reset count
    if (this.matchCount > 0 && now - this.lastMatchTime > 12000) {
      this.matchCount = 0;
    }

    this.lastMatchTime = now;
    this.matchCount += 1;

    // Reset timer
    if (this.resetTimeout) clearTimeout(this.resetTimeout);
    this.resetTimeout = setTimeout(() => {
      this.resetCounter();
    }, 12000);

    // Notify listeners
    this.onWordCallbacks.forEach((cb) => cb(this.matchCount, word));

    // When 3 matches are registered: Trigger emergency confirmation!
    if (this.matchCount >= 3) {
      this.matchCount = 0;
      if (this.resetTimeout) clearTimeout(this.resetTimeout);
      this.onTriggerCallbacks.forEach((cb) => cb());
    }
  }

  public resetCounter() {
    this.matchCount = 0;
    this.onWordCallbacks.forEach((cb) => cb(0, ''));
  }

  public startListening(): boolean {
    this.isListening = true;
    this.matchCount = 0;
    if (this.recognition) {
      try {
        this.recognition.start();
        this.notifyStatus(true, 'Voice trigger active: Listening for "RAPE × 3"');
        return true;
      } catch (e) {
        // Might already be active
        this.notifyStatus(true, 'Voice trigger active');
        return true;
      }
    } else {
      this.notifyStatus(true, 'Voice trigger ready (Simulated & Web Audio)');
      return true;
    }
  }

  public stopListening() {
    this.isListening = false;
    this.resetCounter();
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore
      }
    }
    this.notifyStatus(false, 'Voice trigger paused');
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public getMatchCount(): number {
    return this.matchCount;
  }

  public subscribeWord(cb: VoiceCallback): () => void {
    this.onWordCallbacks.push(cb);
    return () => {
      this.onWordCallbacks = this.onWordCallbacks.filter((c) => c !== cb);
    };
  }

  public subscribeTrigger(cb: TriggerCallback): () => void {
    this.onTriggerCallbacks.push(cb);
    return () => {
      this.onTriggerCallbacks = this.onTriggerCallbacks.filter((c) => c !== cb);
    };
  }

  // Convenient aliases
  public onTriggerActivated(cb: TriggerCallback): () => void {
    return this.subscribeTrigger(cb);
  }

  public resetTriggerState() {
    this.resetCounter();
  }

  public subscribeStatus(cb: StatusCallback): () => void {
    this.onStatusCallbacks.push(cb);
    return () => {
      this.onStatusCallbacks = this.onStatusCallbacks.filter((c) => c !== cb);
    };
  }

  private notifyStatus(active: boolean, message?: string) {
    this.onStatusCallbacks.forEach((cb) => cb(active, message));
  }
}

export const voiceTriggerService = new VoiceTriggerService();
