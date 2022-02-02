export interface AnalyserInterface {
  readonly frequencyBinCount: number;
  getByteFrequencyData(buffer: Uint8Array): void;
}
