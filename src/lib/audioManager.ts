/**
 * Audio processing utilities for PCM 16-bit conversion.
 */

export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  private analyser: AnalyserNode | null = null;
  private dataArray: any | null = null;

  async start(stream: MediaStream, onAudioData: (base64Data: string) => void, onLevel?: (level: number) => void) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass({ sampleRate: 16000 });
    
    // In Safari, AudioContext needs to be explicitly resumed after initialization
    const unlockCapture = async () => {
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }
    };
    await unlockCapture();
    
    // Failsafe document click listener in case above fails
    document.addEventListener('click', unlockCapture, { once: true });
    
    this.source = this.audioContext.createMediaStreamSource(stream);
    
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);

    this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);

    this.source.connect(this.analyser);
    this.analyser.connect(this.processor);
    this.processor.connect(this.audioContext.destination);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Calculate level
      if (onLevel && this.analyser) {
        this.analyser.getByteFrequencyData(this.dataArray!);
        const sum = this.dataArray!.reduce((a: number, b: number) => a + b, 0);
        onLevel(sum / this.dataArray!.length);
      }

      const pcm16 = this.floatTo16BitPCM(inputData);
      const base64 = this.arrayBufferToBase64(pcm16);
      onAudioData(base64);
    };
  }

  stop() {
    this.processor?.disconnect();
    this.source?.disconnect();
    this.audioContext?.close();
  }

  private floatTo16BitPCM(input: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

/**
 * Audio player for incoming PCM chunks.
 */
export class AudioPlayer {
  private audioContext: AudioContext;
  private startTime: number = 0;
  private analyser: AnalyserNode;
  private dataArray: any;
  private activeSources: AudioBufferSourceNode[] = [];

  constructor() {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass({ sampleRate: 24000 });
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.connect(this.audioContext.destination);

    // Bind event to document to unlock audio context in Safari
    const unlockAudio = async () => {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
  }

  async playChunk(base64Data: string, onLevel?: (level: number) => void) {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    // If context is halted, skip processing
    if (this.audioContext.state === 'closed') return;

    const binary = window.atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    const pcmData = new Int16Array(bytes.buffer);
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      floatData[i] = pcmData[i] / 0x8000;
    }

    const audioBuffer = this.audioContext.createBuffer(1, floatData.length, 24000);
    audioBuffer.getChannelData(0).set(floatData);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.analyser);
    
    // Add to active sources to manage interruptions
    this.activeSources.push(source);
    source.onended = () => {
      this.activeSources = this.activeSources.filter(s => s !== source);
    };

    const currentTime = this.audioContext.currentTime;
    if (this.startTime < currentTime) {
      this.startTime = currentTime;
    }
    
    source.start(this.startTime);
    this.startTime += audioBuffer.duration;

    // Periodic level check while playing
    if (onLevel) {
      const checkLevel = () => {
        if (this.audioContext.currentTime < this.startTime) {
          this.analyser.getByteFrequencyData(this.dataArray);
          const sum = this.dataArray.reduce((a: number, b: number) => a + b, 0);
          onLevel(sum / this.dataArray.length);
          requestAnimationFrame(checkLevel);
        } else {
          onLevel(0);
        }
      };
      requestAnimationFrame(checkLevel);
    }
  }

  clear() {
    this.activeSources.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Source might have already stopped
      }
    });
    this.activeSources = [];
    this.startTime = this.audioContext.currentTime;
  }

  stop() {
    this.clear();
    this.startTime = 0;
  }
}
