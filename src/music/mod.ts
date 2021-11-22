import song from '../assets/George Street Shuffle.mp3'
import { guess } from 'web-audio-beat-detector'
const dsp = require('dsp.js')

type TempoEstimation = {
  bmp: number
  offset: number
  tempo: number
}

type ProcessedAudio = {
    rawBuffer: ArrayBuffer,
    tempoEstimation: TempoEstimation,
    colors: number[][]
}

const sampleRate = 44100

export function extract_beat () : Promise<ProcessedAudio> {
  const request = new XMLHttpRequest()
  console.log('getting raw audio')
  request.open('GET', song, true)
  request.responseType = 'arraybuffer'

  console.log(dsp)

  return new Promise((resolve, reject) => {
    request.onload = function () {
      console.log('audio loaded')
      const OfflineContext = window.OfflineAudioContext
      const offlineContext = new OfflineContext(2, 60 * sampleRate, sampleRate)

      // TODO: probably can avoid cloning the buffer by changing the order of
      // things or something
      const rawBuffer = request.response.slice()
      console.log(rawBuffer)

      let decodedBuffer: undefined | AudioBuffer

      offlineContext.decodeAudioData(request.response, function (buffer) {
        // so, buffer here holds the entire song... I should pass this to the
        // main window and reproduce it from there but this means, I can also
        // run fft over this I think, and actually... Can I do windowing?
        console.log('decoding audio')
        console.log(buffer)
        console.log('setting buffer source')
        const source = offlineContext.createBufferSource()
        source.buffer = buffer

        decodedBuffer = buffer

        source.connect(offlineContext.destination)
        source.start(0)

        offlineContext.startRendering()
      }, reject)

      offlineContext.oncomplete = async function (event) {
        console.log('completed decoding')
        console.log(decodedBuffer)
        const buffer = event.renderedBuffer

        console.log('finished processing')
        console.log(buffer)

        console.log('estimating tempo')
        const g = await guess(buffer)

        const colors = extractColors(decodedBuffer)

        resolve({ tempoEstimation: g as unknown as TempoEstimation, rawBuffer: rawBuffer, colors })
      }
    }

    request.send()
  })
}

function extractColors (rawBuffer: AudioBuffer) {
  const channel0 = rawBuffer.getChannelData(0)
  const channel1 = rawBuffer.getChannelData(1)

  const mixRaw = []

  for (let i = 0; i < rawBuffer.length; ++i) {
    mixRaw.push((channel0[i] + channel1[i]) / 2)
  }

  const buffer = new Float32Array(mixRaw)

  const fftSize = 4096
  const windows = []

  console.log(buffer.length)

  for (let i = 0; i < buffer.length; i += fftSize) {
    // take double the size because it's stereo
    const signal = buffer.subarray(i, i + fftSize)

    // mix down to mono to have a single fft
    // const signal = dsp.DSP.deinterleave(dsp.DSP.MIX, buf)

    const fft = new dsp.FFT(fftSize, sampleRate)
    if (signal.length == fftSize) {
      fft.forward(signal)

      windows.push(fft.spectrum)
    } else {
      // TODO: do DFT? but I'm not sure if it will work with the rest of the code tbh
      console.log('ommitting last chunk because of size u.u')
    }
  }

  console.log('finished extraction')
  console.log(`buffer lenght is ${buffer.length}`)
  console.log(windows.length)
  console.log(windows[0].length)
  console.log(fCoeff(2047, 4096))

  const labels = labelFftCoefficients()

  console.log(labels[69])

  const spectoLf = windows.map(spectrum => {
    const lf = []
    for (let i = 0; i <= 127; ++i) {
      const coefficients = labels[i]

      let sum = 0

      for (const coeff of Array.from(coefficients)) {
        assert(!isNaN(spectrum[coeff]), `${coeff}, ${i}`)
        const s = spectrum[coeff]

        // FIXME: I actually don't know why I need to square this
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

  // console.log(spectoLf[100])
  // console.log(chromatograms[100])
  // console.log(colors[100])

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
