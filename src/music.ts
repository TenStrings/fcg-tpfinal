import { statusLabel } from './index'
import { guess } from 'web-audio-beat-detector'
const dsp = require('dsp.js')

export type TempoEstimation = {
  bmp: number
  offset: number
  tempo: number
}

export type ProcessedAudio = {
    rawBuffer: ArrayBuffer,
    tempoEstimation: TempoEstimation,
    colors: number[][]
    peaks: Float32Array,
}

const sampleRate = 44100
const fftSize = 4096

export function fetchAndAnalyse (song: string) : Promise<ProcessedAudio> {
  const request = new XMLHttpRequest()
  request.open('GET', song, true)
  request.responseType = 'arraybuffer'

  statusLabel.innerText = 'Downloading audio'

  return new Promise((resolve) => {
    request.onload = async function () {
      const rawBuffer = request.response

      statusLabel.innerText = 'Download finished'
      const analyzed = await analyseAudio(rawBuffer)

      resolve(analyzed)
    }

    request.send()
  })
}

export function analyseAudio (rawBuffer: ArrayBuffer) : Promise<ProcessedAudio> {
  statusLabel.innerText = 'Analysing audio.'

  const OfflineContext = window.OfflineAudioContext
  const offlineContext = new OfflineContext(2, 60 * sampleRate, sampleRate)

  const buffer = rawBuffer.slice(0)
  let decodedBuffer: undefined | AudioBuffer

  return new Promise((resolve) => {
    offlineContext.decodeAudioData(buffer, function (buffer) {
      // so, buffer here holds the entire song... I should pass this to the
      // main window and reproduce it from there but this means, I can also
      // run fft over this I think, and actually... Can I do windowing?
      const source = offlineContext.createBufferSource()
      source.buffer = buffer

      decodedBuffer = buffer

      source.connect(offlineContext.destination)
      source.start(0)

      offlineContext.startRendering()
    })

    offlineContext.oncomplete = async function (event) {
      const buffer = event.renderedBuffer

      const g = await guess(buffer)

      statusLabel.innerText = 'Extracting colors'

      const colors = extractColors(decodedBuffer)

      statusLabel.innerText = 'Extracting peaks'

      const peaks = extractPeaks(decodedBuffer)

      resolve({
        tempoEstimation: g as unknown as TempoEstimation,
        rawBuffer,
        colors,
        peaks
      })
    }
  })
}

function getMonoBuffer (buffer: AudioBuffer) {
  const channel0 = buffer.getChannelData(0)
  const channel1 = buffer.getChannelData(1)

  const mixRaw = []

  for (let i = 0; i < buffer.length; ++i) {
    mixRaw.push((channel0[i] + channel1[i]) / 2)
  }

  return new Float32Array(mixRaw)
}

function fftWindows (buffer: Float32Array) {
  const windows: number[][] = []

  for (let i = 0; i < buffer.length; i += fftSize) {
    const signal = buffer.subarray(i, i + fftSize)

    const fft = new dsp.FFT(fftSize, sampleRate)

    if (signal.length == fftSize) { // is a power of two, basically
      fft.forward(signal)

      windows.push(fft.spectrum)
    } else {
      // TODO: do DFT? but I'm not sure if it will work with the rest of the
      // code tbh for now, just duplicate the last one
      windows.push(windows[windows.length - 1])
    }
  }

  return windows
}

function extractPeaks (decodedBuffer: AudioBuffer) {
  const buffer = getMonoBuffer(decodedBuffer)
  const resonance = 1
  const lowpass = new dsp.IIRFilter(dsp.DSP.LOWPASS, 150, resonance, sampleRate)

  lowpass.process(buffer)

  const sorted = buffer.map(Math.abs).filter(e => !isNaN(e) && Math.abs(e) != Infinity).sort()

  const threshold = sorted[Math.round(sorted.length * (8 / 10))]

  const peaks = buffer.map(sample => Math.abs(sample) > threshold ? 1.0 : 0.0)

  return peaks
}

function extractColors (decodedBuffer: AudioBuffer) {
  const buffer = getMonoBuffer(decodedBuffer)

  const windows = fftWindows(buffer)

  const labels = labelFftCoefficients()

  const spectoLf = windows.map(spectrum => {
    const lf = []
    for (let i = 0; i <= 127; ++i) {
      const coefficients = labels[i]

      let sum = 0

      for (const coeff of Array.from(coefficients)) {
        assert(!isNaN(spectrum[coeff]), `${coeff}, ${i}`)
        const s = spectrum[coeff]

        sum += s ** 2
      }

      lf.push(sum)
    }
    return lf
  })

  const chromatograms = spectoLf.map(specto => {
    const chromas = []

    for (let i = 0; i < 12; ++i) {
      chromas.push(0)
    }

    for (let i = 0; i < 128; i++) {
      chromas[i % 12] += specto[i]
    }

    return chromas
  })

  const colors = chromatograms.map(chroma => {
    const sum = chroma.reduce((a, b) => a + b)

    return chroma.map(e => e / sum)
  })

  return colors
}

// MIDI pitch to frequency
function fPitch (p: number) {
  return 440 * (2 ** ((p - 69) / 12))
}

// fft coeff to frequency
function fCoeff (k: number, fftSize: number): Frequency {
  // FIXME: move this out, it's a constant
  const n = sampleRate / fftSize
  return k * n
}

// frequency to fft coeff
function fCoeffInv (freq: Frequency, fftSize: number) {
  // FIXME: move this out, it's a constant
  const n = sampleRate / fftSize

  const dist = freq % n

  if (dist <= n / 2) {
    freq -= dist
  } else {
    freq += (n - dist)
  }

  const result = freq / n

  assert(Math.round(result) == result, 'invalid index')

  return result
}

// TODO: mnemoize this, (or lazy init...)
type Frequency = number

function labelFftCoefficients () : Set<number>[] {
  const sets = []

  for (let p = 0; p <= 127; p++) {
    const set: Set<number> = new Set()

    const l: Frequency = fPitch(p - 0.5)
    const h: Frequency = fPitch(p + 0.5)

    // this is a fft coefficient/index
    let k = fCoeffInv(l, 4096)

    while (true) {
      const freq = fCoeff(k, 4096)
      k++

      if (freq < l) {
        continue
      }

      if (freq >= h) {
        break
      }

      set.add(fCoeffInv(freq, 4096))
    }

    sets.push(set)
  }

  return sets
}

function assert (cond: boolean, msg: string) {
  if (!cond) {
    throw new Error(msg)
  }
}
