/**
 * Audio processing utilities for PCM 16-bit conversion with DynamicsCompressor & Soft-Clipping.
 */
export class AudioProcessor {
  static globalContext: AudioContext | null = null;
  
  static unlockGlobal() {
    if (!AudioProcessor.globalContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      AudioProcessor.globalContext = new AudioContextClass({ sampleRate: 16000 });
    }
    if (AudioProcessor.globalContext.state === 'suspended') {
      AudioProcessor.globalContext.resume().catch(() => {});
    }
  }

  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private workletUrl: string | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private mediaStream: MediaStream | null = null;

  async start(
    stream: MediaStream,
    onAudioData: (base64Data: string) => void,
    onLevel?: (level: number) => void,
    isAudioPlaying?: () => boolean
  ) {
    this.mediaStream = stream;
    
    if (!AudioProcessor.globalContext) {
      AudioProcessor.unlockGlobal();
    }
    this.audioContext = AudioProcessor.globalContext;
    
    if (this.audioContext && this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume();
        } catch (e) {}
    }
    
    if (!this.audioContext) return;
    
    this.source = this.audioContext.createMediaStreamSource(stream);
    
    // DynamicsCompressorNode to prevent integer overflow & hard clipping distortion
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-12, this.audioContext.currentTime);
    this.compressor.knee.setValueAtTime(10, this.audioContext.currentTime);
    this.compressor.ratio.setValueAtTime(12, this.audioContext.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
    this.compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);

    const workletCode = `
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bytesWritten = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0];
      if (channelData) {
        for (let i = 0; i < channelData.length; i++) {
          this.buffer[this.bytesWritten++] = channelData[i];
          if (this.bytesWritten >= this.bufferSize) {
            this.flush();
          }
        }
      }
    }
    return true;
  }

  flush() {
    const pcm16 = new Int16Array(this.bufferSize);
    for (let i = 0; i < this.bufferSize; i++) {
      let s = Math.tanh(this.buffer[i]);
      s = Math.max(-1, Math.min(1, s));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    this.port.postMessage({
      pcmData: pcm16.buffer
    }, [pcm16.buffer]);

    this.bytesWritten = 0;
    this.buffer = new Float32Array(this.bufferSize);
  }
}

registerProcessor('pcm-processor', PCMProcessor);
    `;

    if (!this.workletUrl) {
      const blob = new Blob([workletCode], { type: 'application/javascript' });
      this.workletUrl = URL.createObjectURL(blob);
    }

    try {
      await this.audioContext.audioWorklet.addModule(this.workletUrl);
    } catch (e) {
      console.error("Failed to load AudioWorklet", e);
      return;
    }

    this.workletNode = new AudioWorkletNode(this.audioContext, 'pcm-processor');

    // Audio Pipeline: Source -> Dynamics Compressor -> Analyser -> AudioWorklet -> Destination
    this.source.connect(this.compressor);
    this.compressor.connect(this.analyser);
    this.analyser.connect(this.workletNode);
    this.workletNode.connect(this.audioContext.destination);

    this.workletNode.port.onmessage = (e) => {
      if (!this.audioContext || this.audioContext.state === 'closed') return;
      
      const pcmData = e.data.pcmData;
      
      // Calculate energy level
      let avgLevel = 0;
      if (this.analyser && this.dataArray) {
        this.analyser.getByteFrequencyData(this.dataArray as any);
        const sum = this.dataArray.reduce((a: number, b: number) => a + b, 0);
        avgLevel = sum / this.dataArray.length;
        if (onLevel) onLevel(avgLevel);
      }

      // Echo / Self-Interruption Guard:
      if (isAudioPlaying && isAudioPlaying()) {
        if (avgLevel < 25) {
          return;
        }
      }

      const base64 = this.arrayBufferToBase64(pcmData);
      onAudioData(base64);
    };
  }

  stop() {
    if (this.workletNode) {
      this.workletNode.port.onmessage = null;
      try {
        this.workletNode.disconnect();
      } catch (e) {}
      this.workletNode = null;
    }
    if (this.analyser) {
      try {
        this.analyser.disconnect();
      } catch (e) {}
      this.analyser = null;
    }
    if (this.compressor) {
      try {
        this.compressor.disconnect();
      } catch (e) {}
      this.compressor = null;
    }
    if (this.source) {
      try {
        this.source.disconnect();
      } catch (e) {}
      this.source = null;
    }
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      this.mediaStream = null;
    }
    if (this.audioContext) {
      if (false) {
        this.audioContext.close().catch(() => {});
      }
      this.audioContext = null;
    }
    this.dataArray = null;
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
 * Audio player for incoming PCM chunks with Safari AudioContext unlock & source pool cleanup.
 */
export class AudioPlayer {
  static globalContext: AudioContext | null = null;

  static unlockGlobal() {
    if (!AudioPlayer.globalContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      AudioPlayer.globalContext = new AudioContextClass({ sampleRate: 24000 });
    }
    if (AudioPlayer.globalContext.state === 'suspended') {
      AudioPlayer.globalContext.resume().catch(() => {});
    }
  }

  private audioContext: AudioContext | null = null;
  private startTime: number = 0;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private activeSources: AudioBufferSourceNode[] = [];

  constructor() {
    this.initContext();
  }

  private initContext() {
    if (!AudioPlayer.globalContext) {
      AudioPlayer.unlockGlobal();
    }
    this.audioContext = AudioPlayer.globalContext;
    if (!this.audioContext) return;
    
    if (!this.analyser) {
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.connect(this.audioContext.destination);
    }
  }

  async playChunk(base64Data: string, onLevel?: (level: number) => void) {
    this.initContext();
    if (!this.audioContext || !this.analyser) return;

    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (e) {}
    }
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
    
    this.activeSources.push(source);
    source.onended = () => {
      this.activeSources = this.activeSources.filter((s) => s !== source);
    };

    const currentTime = this.audioContext.currentTime;
    if (this.startTime < currentTime) {
      this.startTime = currentTime;
    }
    
    source.start(this.startTime);
    this.startTime += audioBuffer.duration;

    if (onLevel && this.dataArray && this.analyser) {
      const checkLevel = () => {
        if (this.audioContext && this.audioContext.currentTime < this.startTime && this.analyser && this.dataArray) {
          this.analyser.getByteFrequencyData(this.dataArray as any);
          const sum = this.dataArray.reduce((a: number, b: number) => a + b, 0);
          onLevel(sum / this.dataArray.length);
          requestAnimationFrame(checkLevel);
        } else {
          if (onLevel) onLevel(0);
        }
      };
      requestAnimationFrame(checkLevel);
    }
  }

  get isPlaying(): boolean {
    if (!this.audioContext) return false;
    return this.audioContext.currentTime < this.startTime;
  }

  clear() {
    this.activeSources.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {}
    });
    this.activeSources = [];
    if (this.audioContext) {
      this.startTime = this.audioContext.currentTime;
    }
  }

  stop() {
    this.clear();
    this.startTime = 0;
    if (this.analyser) {
      try {
        this.analyser.disconnect();
      } catch (e) {}
      this.analyser = null;
    }
    if (this.audioContext) {
      if (false) {
        this.audioContext.close().catch(() => {});
      }
      this.audioContext = null;
    }
    this.dataArray = null;
  }
}
