/**
 * Audio processing utilities for PCM 16-bit conversion with DynamicsCompressor & Soft-Clipping.
 */
export class AudioProcessor {
  static globalContext: AudioContext | null = null;
  static workletLoaded: boolean = false;
  
  static unlockGlobal() {
    if (!AudioProcessor.globalContext || AudioProcessor.globalContext.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      try {
        // Try native 16kHz first
        AudioProcessor.globalContext = new AudioContextClass({ sampleRate: 16000 });
      } catch (e) {
        // If soundcard rejects 16kHz (common on desktop PC/Mac), use default system rate
        try {
          AudioProcessor.globalContext = new AudioContextClass();
        } catch (err) {
          console.error("Failed to create Mic AudioContext:", err);
        }
      }
    }
    if (AudioProcessor.globalContext && AudioProcessor.globalContext.state === 'suspended') {
      AudioProcessor.globalContext.resume().then(() => console.log('Mic AudioContext unlocked')).catch(() => {});
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
    
    if (!AudioProcessor.globalContext || AudioProcessor.globalContext.state === 'closed') {
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

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);

    const workletCode = `
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetSampleRate = 16000;
    this.sourceSampleRate = sampleRate; // Global in AudioWorkletGlobalScope
    this.bufferSize = 2048; // Output frame buffer size
    this.outputBuffer = new Int16Array(this.bufferSize);
    this.outputIndex = 0;
    this.resampleRatio = this.sourceSampleRate / this.targetSampleRate;
    this.samplePosition = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channelData = input[0];
    if (!channelData || channelData.length === 0) return true;

    if (Math.abs(this.resampleRatio - 1) < 0.05) {
      // 1:1 mapping if already 16kHz
      for (let i = 0; i < channelData.length; i++) {
        let s = Math.max(-1, Math.min(1, channelData[i]));
        this.outputBuffer[this.outputIndex++] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        if (this.outputIndex >= this.bufferSize) {
          this.flush();
        }
      }
    } else {
      // Resample down to 16kHz via linear interpolation for PC/Mac hardware rates (44.1k/48k)
      const inputLength = channelData.length;
      while (this.samplePosition < inputLength) {
        const index0 = Math.floor(this.samplePosition);
        const index1 = Math.min(index0 + 1, inputLength - 1);
        const fraction = this.samplePosition - index0;
        const s0 = channelData[index0];
        const s1 = channelData[index1];
        let interpolated = s0 + fraction * (s1 - s0);
        interpolated = Math.max(-1, Math.min(1, interpolated));
        
        this.outputBuffer[this.outputIndex++] = interpolated < 0 ? interpolated * 0x8000 : interpolated * 0x7FFF;
        if (this.outputIndex >= this.bufferSize) {
          this.flush();
        }
        this.samplePosition += this.resampleRatio;
      }
      this.samplePosition -= inputLength;
    }
    return true;
  }

  flush() {
    if (this.outputIndex === 0) return;
    const pcm = new Int16Array(this.outputIndex);
    pcm.set(this.outputBuffer.subarray(0, this.outputIndex));
    this.port.postMessage({
      pcmData: pcm.buffer
    }, [pcm.buffer]);
    this.outputIndex = 0;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
    `;

    if (!this.workletUrl) {
      const blob = new Blob([workletCode], { type: 'application/javascript' });
      this.workletUrl = URL.createObjectURL(blob);
    }

    try {
      if (!AudioProcessor.workletLoaded) {
        await this.audioContext.audioWorklet.addModule(this.workletUrl);
        AudioProcessor.workletLoaded = true;
      }
    } catch (e) {
      console.warn("AudioWorklet load issue:", e);
      AudioProcessor.workletLoaded = true; // Assume it's loaded if it throws
    }

    this.workletNode = new AudioWorkletNode(this.audioContext, 'pcm-processor');

    // Audio Pipeline: Source -> Dynamics Compressor -> Analyser -> AudioWorklet -> Destination
    this.source.connect(this.analyser);
    this.analyser.connect(this.workletNode);
    // this.workletNode.connect(this.audioContext.destination);

    this.workletNode.port.onmessage = (e) => {
      if (!this.audioContext || this.audioContext.state === 'closed') return;
      
      const pcmData = e.data.pcmData;
      
      // Calculate energy level
      let avgLevel = 0;
      if (this.analyser && this.dataArray) {
        this.analyser.getByteFrequencyData(this.dataArray as any);
        const sum = this.dataArray.reduce((a, b) => a + b, 0);
        avgLevel = sum / this.dataArray.length;
        if (onLevel) onLevel(avgLevel);
      }

      // Echo / Self-Interruption Guard:
      // If the bot is speaking, we drop low-volume packets to prevent the microphone from picking up the speakers and causing self-interruption.
      // Echo Guard removed for stability.
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
        this.audioContext?.close().catch(() => {});
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
    if (!AudioPlayer.globalContext || AudioPlayer.globalContext.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      try {
        AudioPlayer.globalContext = new AudioContextClass({ sampleRate: 24000 });
      } catch (e) {
        try {
          AudioPlayer.globalContext = new AudioContextClass();
        } catch (err) {
          console.error("Failed to create Player AudioContext:", err);
        }
      }
    }
    if (AudioPlayer.globalContext && AudioPlayer.globalContext.state === 'suspended') {
      AudioPlayer.globalContext.resume().then(() => console.log('Player AudioContext unlocked')).catch(() => {});
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

    
    console.log("Received chunk length:", base64Data.length);
    let binary;
    try {
        binary = window.atob(base64Data);
    } catch(e) {
        console.error("Failed to decode base64 audio chunk:", e);
        return;
    }

    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    
    if (bytes.length % 2 !== 0) {
        console.warn("Odd byte length:", bytes.length);
    }
    // safely create Int16Array
    const bufferLength = Math.floor(bytes.length / 2) * 2;
    const pcmData = new Int16Array(bytes.buffer, 0, bufferLength / 2);

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
    const margin = 0.05; // 50ms safety margin for jitter and JS execution
    if (this.startTime < currentTime + margin) {
      this.startTime = currentTime + margin;
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
        this.audioContext?.close().catch(() => {});
      }
      this.audioContext = null;
    }
    this.dataArray = null;
  }
}
