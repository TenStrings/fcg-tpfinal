import fshader from './shaders/fragment.glsl'
import vshader from './shaders/vertex.glsl'
import { cubeVAO, RenderComponent } from './cube'
import {
  rotateXMatrix, rotateYMatrix, rotateZMatrix, matrixTrans, matrixScale,
  perspectiveMatrix, matrixArrayMult
} from
  './algebra'
import { initShaders } from './shader_helpers'
import { fetchAndAnalyse, analyseAudio, ProcessedAudio } from './music/mod'
import './stylesheets/index.css'
import song0 from './assets/shades-of-spring-by-kevin-macleod-from-filmmusic-io.mp3'
import song1 from './assets/werq-by-kevin-macleod-from-filmmusic-io.mp3'

type State = {
  audioData: ProcessedAudio,
  playing: boolean,
  projection: Float32Array,
  currentPalette: Float32Array[],
  components: EComponents[]
  cameraTrans: { rotation: RotationComponent, position: PositionComponent },
  lightPos: Float32Array,
  shininess: number,
  color: Float32Array,
  dataArray: Uint8Array,
  audioContext: AudioContext,
  analyser: AnalyserNode,
  audio: HTMLMediaElement,
}

let state : State | undefined

const songs: Record<string, string | ArrayBuffer | ProcessedAudio> = {
  song0: song0,
  song1: song1
}

export const statusLabel = document.getElementById('loading') as HTMLLabelElement

async function initState (width: number, height: number, songId: string) : Promise<State> {
  console.log('initializing state')

  statusLabel.innerText = 'Analyzing audio'

  const song = songs[songId]
  let audioData

  if (typeof song === 'string') {
    audioData = await fetchAndAnalyse(song)
  } else if (song instanceof ArrayBuffer) {
    console.log('found array buffer, analysing')
    audioData = await analyseAudio(song)
  } else {
    audioData = song
  }

  // cache the results just in case
  songs[songId] = audioData

  // TODO: move this to initState?
  const blob = new Blob([audioData.rawBuffer], { type: 'audio/mp3' })
  const url = window.URL.createObjectURL(blob)

  const audioContext = new window.AudioContext()

  const audio = document.createElement('audio')
  audio.src = url
  audio.controls = true
  audio.id = 'audio-source'

  let playing = false

  audio.addEventListener('play', function () {
    audioContext.resume()
    playing = true
  })

  audio.addEventListener('pause', function () {
    playing = false
  })

  const analyser = audioContext.createAnalyser()
  analyser.fftSize = 256
  const track = audioContext.createMediaElementSource(audio)
  track.connect(analyser).connect(audioContext.destination)

  const audioHolder = document.getElementById('audio-holder')
  audioHolder.appendChild(audio)

  statusLabel.innerText = 'Ready'
  const cameraTrans = {
    rotation: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: -3 }
  }
  const currentPalette = [
    new Float32Array([1.0, 0.0, 0.0]),
    new Float32Array([0.0, 0.2, 0.5]),
    new Float32Array([0.0, 0.3, 0.5]),
    new Float32Array([0.1, 0.4, 0.5]),
    new Float32Array([0.2, 0.5, 0.0]),
    new Float32Array([0.3, 0.6, 0.8]),
    new Float32Array([0.4, 0.7, 0.1]),
    new Float32Array([0.5, 0.8, 0.1]),
    new Float32Array([0.6, 0.9, 0.5]),
    new Float32Array([0.7, 0.1, 0.4]),
    new Float32Array([0.8, 0.2, 0.3]),
    new Float32Array([0.9, 0.3, 0.2])
  ]

  const sampleRate = 44100
  const fftSize = 256

  const freqStep = sampleRate / fftSize
  const maxFrequency = 5000 / freqStep

  const bufferLength = maxFrequency
  const start = -8
  const end = 8
  const step = (end - start) / bufferLength

  const dataArray = new Uint8Array(maxFrequency)

  const components: EComponents[] = []

  for (let i = 0; i < bufferLength - 1; ++i) {
    const pos = start + (step * i)
    components.push({
      render: 'cube',
      position: { x: pos, y: -3.5, z: -5 },
      rotation: { x: 0 * Math.PI, y: (3 / 2) * Math.PI, z: 0 * Math.PI },
      scale: { x: 0.09, y: 0.5, z: 0.1 }
    })
  }

  oscillator = components.length

  components.push(
    {
      render: 'cube',
      position: { x: 0, y: 4.5, z: -15 },
      rotation: { x: 0 * Math.PI, y: 0 * Math.PI, z: 0 * Math.PI },
      scale: { x: 1, y: 2, z: 0.3 }
    }
  )

  const projection = perspectiveMatrix(width / height)

  const lightPos = new Float32Array([0, 0, 10])
  const shininess = 16
  const color : Float32Array = new Float32Array([0.5, 0.5, 0.5])

  return {
    audioData,
    playing,
    projection,
    currentPalette,
    components,
    cameraTrans,
    lightPos,
    shininess,
    color,
    dataArray,
    audioContext,
    analyser,
    audio
  }
}

let program: Program

let gl: WebGL2RenderingContext | undefined

let oscillator: number | any

export type Program = {
  id: WebGLProgram,
  uniforms: UniformLocations,
}

type UniformsK = 'mvp' | 'mv' | 'mn' | 'lightDir' | 'shininess' | 'color'

type UniformLocations = Record<UniformsK, WebGLUniformLocation>
// type UniformValues = Record<UniformsK, Float32Array>

type UniformValues = {
    mvp: Float32Array,
    mv: Float32Array,
    mn: Float32Array,
    lightDir: Float32Array,
    shininess: number,
    color: Float32Array,
}

function setUniforms (p: Program, values: UniformValues) {
  gl.uniformMatrix4fv(p.uniforms.mvp, false, values.mvp)
  gl.uniformMatrix4fv(p.uniforms.mv, false, values.mv)
  gl.uniformMatrix3fv(p.uniforms.mn, false, values.mn)
  gl.uniform3f(p.uniforms.lightDir, values.lightDir[0], values.lightDir[1], values.lightDir[2])
  gl.uniform1f(p.uniforms.shininess, values.shininess)
  gl.uniform3f(p.uniforms.color, values.color[0], values.color[1], values.color[2])
}

type PositionComponent = { x: number, y: number, z: number}
type RotationComponent = {
  x: number,
  y: number,
  z: number
}
type ScaleComponent = { x: number, y: number, z: number}

type EComponents = {
  render: PrimitiveKind,
  position: PositionComponent,
  rotation: RotationComponent,
  scale: ScaleComponent,
}

type PrimitiveKind = 'cube'
type Primitives = Record<PrimitiveKind, RenderComponent | undefined >

const primitives: Primitives = { cube: undefined }

function mixColors (currentColors: number[]) : Float32Array {
  function addV (a: Float32Array, b: Float32Array) {
    a[0] += b[0]
    a[1] += b[1]
    a[2] += b[2]
  }

  function scale (a: Float32Array, scalar: number) {
    a[0] *= scalar
    a[1] *= scalar
    a[2] *= scalar
  }

  const palette: Float32Array[] = state.currentPalette.map(inner => inner.slice())

  for (let i = 0; i < 12; i++) {
    scale(palette[i], currentColors[i])
  }

  for (let i = 1; i < 12; ++i) {
    addV(palette[0], palette[i])
  }

  return palette[0]
}

function render (gl: WebGL2RenderingContext, view: Float32Array) {
  const lightDir = state.lightPos

  state.components.forEach(comp => {
    const render = primitives[comp.render]

    const scale = matrixScale(comp.scale.x, comp.scale.y, comp.scale.z)

    const translation = matrixTrans(comp.position.x, comp.position.y, comp.position.z)

    const rotationX = rotateXMatrix(comp.rotation.x)
    const rotationY = rotateYMatrix(comp.rotation.y)
    const rotationZ = rotateZMatrix(comp.rotation.z)

    const mv = matrixArrayMult([
      view,
      translation,
      rotationX,
      rotationY,
      rotationZ,
      scale
    ])

    const mvp = matrixArrayMult([
      state.projection,
      mv
    ])

    // TODO: why does this work?
    const mn = new Float32Array([mv[0], mv[1], mv[2], mv[4], mv[5], mv[6], mv[8], mv[9], mv[10]])

    gl.useProgram(render.program.id)

    gl.bindVertexArray(render.vao)

    setUniforms(program, {
      mvp,
      mv,
      mn,
      // FIXME: should be lightPos
      lightDir,
      shininess: state.shininess,
      color: state.color
    })

    gl.drawElements(gl.TRIANGLES, render.count, gl.UNSIGNED_SHORT, 0)
  })
}

function draw (gl: WebGL2RenderingContext) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  // Each item in the array represents the decibel value for a specific
  // frequency. The frequencies are spread linearly from 0 to 1/2 of the sample
  // rate. For example, for 48000 sample rate, the last item of the array will
  // represent the decibel value for 24000 Hz.

  const dataArray = state.dataArray

  state.analyser.getByteFrequencyData(state.dataArray)

  const bms = state.audioData.tempoEstimation.tempo / 60

  const freq = 1 / bms
  const step = (2 / freq)

  if (!state.audio.paused && state.audio.currentTime) {
    const currentTime = state.audio.currentTime - state.audioData.tempoEstimation.offset
    const d = (currentTime % freq)

    for (let i = 0; i < dataArray.length; ++i) {
      state.components[i].scale.y = (dataArray[i] / 256) * 3
      state.components[i].position.y = state.components[i].scale.y - 3

      if (state.audioData.peaks[Math.round(state.audio.currentTime * 44100)] == 1.0) {
        state.components[i].scale.z = 0.13
      } else {
        state.components[i].scale.z = 0.1
      }
    }

    const even = Math.floor(currentTime % (freq / 2)) == 0

    const normalized = d * step

    let pos = 1 - normalized

    if (even) {
      pos *= -1
    }

    pos *= 0.15

    state.components[oscillator].position.x = pos

    state.color = mixColors(state.audioData.colors[Math.floor((state.audio.currentTime * 44100) / 4096)])
  }

  const translation = matrixTrans(state.cameraTrans.position.x, state.cameraTrans.position.y, state.cameraTrans.position.z)

  const rotationX = rotateXMatrix(state.cameraTrans.rotation.x)
  const rotationY = rotateYMatrix(state.cameraTrans.rotation.y)
  const rotationZ = rotateZMatrix(state.cameraTrans.rotation.z)

  const view = matrixArrayMult([translation, rotationX, rotationZ, rotationY])
  render(gl, view)

  requestAnimationFrame(() => draw(gl))
}

function initWebGL (canvas: HTMLCanvasElement) {
  // Inicializamos el canvas WebGL
  canvas.oncontextmenu = function () { return false }
  const gl = canvas.getContext('webgl2', { antialias: true, depth: true })
  if (!gl) {
    alert('Imposible inicializar WebGL. Tu navegador quizás no lo soporte.')
    return
  }

  gl.clearColor(0.0, 0.0, 0.0, 1)
  gl.enable(gl.DEPTH_TEST) // habilitar test de profundidad

  return gl
}

// Funcion para actualizar el tamaño de la ventana cada vez que se hace resize
function updateCanvasSize (gl: WebGLRenderingContext, canvas: HTMLCanvasElement) {
  // 1. Calculamos el nuevo tamaño del viewport
  // canvas.style.width = '100%'
  // canvas.style.height = '100%'

  // console.log(canvas.style.width)
  // console.log(canvas.style.height)

  // const pixelRatio = window.devicePixelRatio || 1

  // console.log(pixelRatio)

  // canvas.width = pixelRatio * canvas.clientWidth
  // canvas.height = pixelRatio * canvas.clientHeight

  // console.log(canvas.clientWidth)
  // console.log(canvas.clientHeight)
  // console.log(canvas.width)
  // console.log(canvas.height)

  // const width = (canvas.width / pixelRatio)
  // const height = (canvas.height / pixelRatio)

  // canvas.style.width = width + 'px'
  // canvas.style.height = height + 'px'

  // 2. Lo seteamos en el contexto WebGL
  console.log(`canvas width ${canvas.clientWidth}`)
  console.log(`canvas height ${canvas.clientHeight}`)
  gl.viewport(0, 0, canvas.width, canvas.height)

  // 3. Cambian las matrices de proyección, hay que actualizarlas
  // UpdateProjectionMatrix()
}

// Al cargar la página
window.onload = async function () {
  const canvas = document.getElementById('view') as HTMLCanvasElement

  const defaultSelector = document.getElementById('song0') as HTMLInputElement
  defaultSelector.checked = true

  gl = initWebGL(canvas)
  const programId = initShaders(vshader, fshader, gl)

  gl.useProgram(programId)

  program = {
    id: programId,
    uniforms: {
      mvp: gl.getUniformLocation(programId, 'mvp'),
      mv: gl.getUniformLocation(programId, 'mv'),
      mn: gl.getUniformLocation(programId, 'mn'),
      lightDir: gl.getUniformLocation(programId, 'lightDir'),
      shininess: gl.getUniformLocation(programId, 'shininess'),
      color: gl.getUniformLocation(programId, 'color')
    }
  }

  // updateCanvasSize(gl, canvas)

  gl.clear(gl.COLOR_BUFFER_BIT)

  primitives.cube = cubeVAO(gl, program)

  state = await initState(canvas.width, canvas.height, 'song0')

  draw(gl)

  canvas.addEventListener('wheel', function (event: WheelEvent) {
    const s = 0.3 * event.deltaY / canvas.height
    state.cameraTrans.position.z += -s
  })

  let mouseDown : { cx: number, cy: number } | undefined

  canvas.addEventListener('mousedown', function (event: MouseEvent) {
    mouseDown = {
      cx: event.clientX, cy: event.clientY
    }
  })

  canvas.addEventListener('mouseup', function (_event: MouseEvent) {
    mouseDown = undefined
  })

  canvas.addEventListener('mousemove', function (event) {
    if (mouseDown !== undefined) {
      let { cx, cy } = mouseDown

      state.cameraTrans.rotation.y += -1 * (cx - event.clientX) / (canvas.width * 5)
      state.cameraTrans.rotation.x += -1 * (cy - event.clientY) / (canvas.height * 5)

      cx = event.clientX
      cy = event.clientY
    }
  })

  const loadSong = document.getElementById('load-song') as HTMLInputElement

  loadSong.addEventListener('change', async function () {
    console.log(loadSong.files)

    const songList = document.getElementById('song-list') as HTMLElement

    const item = document.createElement('li')

    const input = document.createElement('input') as HTMLInputElement
    input.type = 'radio'
    input.name = 'song-selector'

    const songNumber = Object.keys(songs).length
    const songId = 'song' + songNumber
    songs[songId] = await loadSong.files[0].arrayBuffer()

    input.id = songId

    input.addEventListener('change', radioInputHandler)

    item.appendChild(input)

    const label = document.createElement('label') as HTMLLabelElement
    label.innerHTML = loadSong.files[0].name
    label.htmlFor = songId

    item.appendChild(label)
    songList.appendChild(item)
  })

  const radioInputs = document.getElementsByName('song-selector')

  async function radioInputHandler (e: InputEvent) {
    const radioInput = e.target as HTMLInputElement
    state.audio.pause()
    state.audio.controls = false

    const newState = await initState(canvas.width, canvas.height, radioInput.id)

    const audioHolder = document.getElementById('audio-holder')
    audioHolder.removeChild(state.audio)

    state = newState
  }

  radioInputs.forEach((radioInput: HTMLInputElement) => {
    radioInput.addEventListener('change', radioInputHandler)
  })

  for (let i = 0; i < 12; i++) {
    const picker = document.getElementById(`color${i}`) as HTMLInputElement
    const color = state.currentPalette[i]

    const bytes = []

    for (let j = 0; j < 3; ++j) {
      bytes.push(Math.round(color[j] * 255))
    }

    picker.value = '#' + hex(bytes)

    picker.addEventListener('change', function () {
      const bytes = new Float32Array(hexStringToBytes(picker.value.slice(1)))
      state.currentPalette[i] = bytes.map(b => b / 256)
    })
  }
}

function hexStringToBytes (s: string) {
  const bytes = []
  for (let c = 0; c < s.length; c += 2) { bytes.push(parseInt(s.substr(c, 2), 16)) }
  return bytes
}

const byteToHex: string[] = []

for (let n = 0; n <= 0xff; ++n) {
  const hexOctet = ('0' + n.toString(16)).slice(-2)
  byteToHex.push(hexOctet)
}

function hex (arr: number[]) {
  const buff = new Uint8Array(arr)
  const hexOctets = []

  for (let i = 0; i < buff.length; ++i) { hexOctets.push(byteToHex[buff[i]]) }

  return hexOctets.join('')
}
