import { AnalyserInterface } from './analyser.inteface';

export class Visualzer {
  private requestId: number = 0;
  private analyserNode: AnalyserInterface = null;
  private buffer: Uint8Array;
  private readonly width: number;
  private readonly height: number;
  private readonly context: CanvasRenderingContext2D;

  constructor(readonly canvas: HTMLCanvasElement) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.context = canvas.getContext('2d');
  }

  connect(analyserNode: AnalyserInterface) {
    if (this.requestId) {
      this.disconnect();
    }
    this.analyserNode = analyserNode;
    this.buffer = new Uint8Array(analyserNode.frequencyBinCount);
    this.frame();
  }

  disconnect() {
    cancelAnimationFrame(this.requestId);
  }

  private frame() {
    this.analyserNode.getByteFrequencyData(this.buffer);
    this.draw();
    this.requestId = requestAnimationFrame(() => this.frame());
  }

  private draw() {
    this.context.fillStyle = 'black';
    this.context.fillRect(0, 0, this.width, this.height);
    const barWidth = (this.width / this.buffer.length) * 2;
    let x = 0;

    for (let i = 0; i < this.buffer.length; i++) {
      const height = (this.buffer[i] / 255.0) * this.height;
      this.context.fillStyle = `rgb(${height * 100}, 50, 50)`;
      this.context.fillRect(x, this.height - height, barWidth, height);
      x += barWidth + 1;
    }
  }
}
