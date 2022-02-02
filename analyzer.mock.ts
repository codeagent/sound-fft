import { AnalyserInterface } from './analyser.inteface';
import { abs, Complex, dft } from './fft';

/**
 * @link https://webaudio.github.io/web-audio-api/#fft-windowing-and-smoothing-over-time
 */
export class AnalyserMock implements AnalyserInterface {
  get frequencyBinCount(): number {
    return this._fftSize / 2;
  }

  set fftSize(fftSize: number) {
    const rounded = 1 << Math.ceil(Math.log2(fftSize));
    if (rounded !== fftSize) {
      throw new Error('fftSize must be power of 2: 32, 64, 128, ... 32768');
    }

    this._fftSize = fftSize;
    this.bufferWindow = new Float32Array(this._fftSize);
    this.lastFrameBuffer = new Float32Array(this._fftSize);
  }

  get fftSize(): number {
    return this._fftSize;
  }

  smoothingTimeConstant: number = 0.8;
  minDecibels: number = -100;
  maxDecibels: number = -30;

  private _fftSize: number = 512;
  private startTime: number = 0;
  private duration: number;
  private source: AudioBufferSourceNode;
  private bufferWindow: Float32Array;
  private lastFrameBuffer: Float32Array;

  constructor(
    public readonly transformer: (signal: Float32Array) => Complex[] = dft
  ) {}

  getByteFrequencyData(buffer: Uint8Array): void {
    if (!this.source) {
      return;
    }

    const time = this.source.context.currentTime - this.startTime;
    const data = this.source.buffer.getChannelData(0);
    this.source.buffer.length;
    const s = Math.min(
      1.0,
      Math.max(0.0, 1.0 - (this.duration - time) / this.duration)
    );

    const offset = Math.floor(data.length * s);
    const view = new Float32Array(
      data.buffer,
      offset * Float32Array.BYTES_PER_ELEMENT,
      Math.min(this.fftSize, data.length - offset)
    );

    this.bufferWindow.fill(0.0);
    this.bufferWindow.set(view);

    this.blackmanWindow(this.bufferWindow);

    const fourier = this.fourierTransform(this.bufferWindow);

    for (let i = 0; i < fourier.length / 2; i++) {
      const smoothed = lerp(
        abs(fourier[i]) / fourier.length, // take normalized fourier transform
        this.lastFrameBuffer[i],
        this.smoothingTimeConstant
      );
      this.lastFrameBuffer[i] = smoothed;

      const decibels = clamp(
        20 * Math.log10(smoothed),
        this.minDecibels,
        this.maxDecibels
      );

      buffer[i] =
        ((decibels - this.minDecibels) /
          (this.maxDecibels - this.minDecibels)) *
        255.0;
    }
  }

  connect(source: AudioBufferSourceNode) {
    this.startTime = source.context.currentTime;
    this.source = source;
    this.duration = source.buffer.duration;
  }

  private fourierTransform(signal: Float32Array) {
    return this.transformer(signal);
  }

  private blackmanWindow(buffer: Float32Array) {
    const alpha = 0.16;
    const a0 = (1.0 - alpha) / 2;
    const a1 = 0.5;
    const a2 = alpha / 2;
    const coeff = (2 * Math.PI) / buffer.length;

    for (let i = 0; i < buffer.length; i++) {
      const w = a0 - a1 * Math.cos(coeff * i) + a2 * Math.cos(2 * coeff * i);
      buffer[i] = buffer[i] * w;
    }

    return buffer;
  }
}

const lerp = (a: number, b: number, t: number) => a * (1.0 - t) + b * t;
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
