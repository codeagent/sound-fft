// Import stylesheets
import './style.css';
import { AnalyserMock } from './analyzer.mock';
import { dft, fft } from './fft';
import { Profiler } from './profiler';
import { TextToSpeech } from './text-to-speech';
import { Visualzer } from './visualizer';

class PageView {
  private readonly textToSpeech = new TextToSpeech(
    'AIzaSyDfPbWqV597qWPwEbiseRLOM6RvXcaztKc'
  );
  private readonly nativeVisualizer = new Visualzer(
    document.getElementById('native') as HTMLCanvasElement
  );
  private readonly dftVisualizer = new Visualzer(
    document.getElementById('dft') as HTMLCanvasElement
  );
  private readonly fftVisualizer = new Visualzer(
    document.getElementById('fft') as HTMLCanvasElement
  );

  private dftAnalyserMock = new AnalyserMock((signal: Float32Array) => {
    this.profiler.begin('dft');
    const f = dft(signal);
    this.profiler.end('dft');
    return f;
  });
  private fftAnalyserMock = new AnalyserMock((signal: Float32Array) => {
    this.profiler.begin('fft');
    const f = fft(signal);
    this.profiler.end('fft');
    return f;
  });
  private analyzer: AnalyserNode;
  private readonly context = new AudioContext();
  private readonly profiler = Profiler.instance;

  constructor() {
    this.createAudioGraph();

    this.analyzer.smoothingTimeConstant =
      this.dftAnalyserMock.smoothingTimeConstant =
      this.fftAnalyserMock.smoothingTimeConstant =
        0.9;

    this.analyzer.fftSize =
      this.dftAnalyserMock.fftSize =
      this.fftAnalyserMock.fftSize =
        512;
  }

  initView() {
    this.nativeVisualizer.connect(this.analyzer);
    this.dftVisualizer.connect(this.dftAnalyserMock);
    this.fftVisualizer.connect(this.fftAnalyserMock);

    this.profiler
      .listen('dft')
      .subscribe(
        (value) =>
          (document.getElementById('dft-measute').innerText = `${value.toFixed(
            2
          )}`)
      );

    this.profiler
      .listen('fft')
      .subscribe(
        (value) =>
          (document.getElementById('fft-measute').innerText = `${value.toFixed(
            2
          )}`)
      );
  }

  async synthesize(text: string) {
    if (!text) {
      return;
    }

    const speech = await this.textToSpeech.synthesize(text);
    const source = this.context.createBufferSource();
    source.buffer = await this.context.decodeAudioData(speech.buffer);
    source.connect(this.analyzer);
    this.dftAnalyserMock.connect(source);
    this.fftAnalyserMock.connect(source);
    source.start();
  }

  setFftSize(fftSize: number) {
    this.analyzer.fftSize =
      this.dftAnalyserMock.fftSize =
      this.fftAnalyserMock.fftSize =
        fftSize;
  }

  private createAudioGraph() {
    const gain = this.context.createGain();
    gain.gain.value = 0.1;
    gain.connect(this.context.destination);

    this.analyzer = this.context.createAnalyser();
    this.analyzer.connect(gain);
  }
}

const view = new PageView();
view.initView();

document
  .querySelector('#speech')
  .addEventListener(
    'click',
    async () => {
      console.log((document.getElementById('text') as HTMLInputElement).value)
      await view.synthesize(
        (document.getElementById('text') as HTMLInputElement).value
      )
    }
  );

document
  .querySelector('#fftSize')
  .addEventListener('change', (e) => view.setFftSize(+e.target['value']));
