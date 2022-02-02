export type Complex = [number, number];
export const complex = (re: number, im: number): Complex => [re, im];
export const add = (a: Complex, b: Complex): Complex => [
  a[0] + b[0],
  a[1] + b[1],
];
export const mult = (a: Complex, b: Complex): Complex => [
  a[0] * b[0] - a[1] * b[1],
  a[0] * b[1] + a[1] * b[0],
];
export const eix = (x: number): Complex => [Math.cos(x), Math.sin(x)];
export const abs = (v: Complex) => Math.sqrt(v[0] * v[0] + v[1] * v[1]);
export const scale = (v: Complex, s: number): Complex => [v[0] * s, v[1] * s];

// --

/**
 * Discrete fourier transform
 */
export const dft = (signal: Float32Array): Complex[] => {
  const n = signal.length;
  const fhat = new Array<Complex>(n);
  const coeff = (-2 * Math.PI) / n;
  for (let k = 0, k1 = n; k < k1; k++) {
    fhat[k] = complex(0.0, 0.0);
    for (let j = 0; j < n; j++) {
      fhat[k] = add(fhat[k], scale(eix(coeff * k * j), signal[j]));
    }
  }
  return fhat;
};

/**
 * Fast Fourier Transform
 */
export const fft = (signal: Float32Array): Complex[] => {
  if (signal.length <= 2) {
    return dft(signal);
  } else {
    const n = signal.length;
    const n2 = n / 2;
    const even = new Float32Array(n2);
    const odd = new Float32Array(n2);
    for (let i = 0, e = 0, o = 0; i < n; i++) {
      if (i % 2 === 0) {
        even[e++] = signal[i];
      } else {
        odd[o++] = signal[i];
      }
    }

    const evenFft = fft(even);
    const oddFft = fft(odd);
    const fhat = new Array<Complex>(n);
    const coeff = (-2 * Math.PI) / n;
    for (let k = 0; k < n; k++) {
      fhat[k] = add(evenFft[k % n2], mult(oddFft[k % n2], eix(coeff * k)));
    }
    return fhat;
  }
};
