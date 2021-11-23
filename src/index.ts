import song from './assets/George Street Shuffle.mp3'
import fshader from './shaders/fragment.glsl'
import vshader from './shaders/vertex.glsl'
import { cubeVAO, RenderComponent } from './cube'
import {
  rotateXMatrix, rotateYMatrix, rotateZMatrix, matrixTrans, matrixScale,
  perspectiveMatrix, id, matrixArrayMult
} from
  './algebra'
import { initShaders } from './shader_helpers'
import { extract_beat } from './music/mod'
import './stylesheets/index.css'

const audioContext = new window.AudioContext()
const fftSize = 256
let playing = false
let audio: HTMLMediaElement | undefined

let bmp: number | undefined
let bmp_offset: number | undefined
let colors: number[][] | undefined
let peaks: Float32Array | undefined

let projection = id

const cameraTrans: {
    rotation: RotationComponent,
    position: PositionComponent,
} = {
  rotation: { x: 0, y: 0, z: 0 },
  position: { x: 0, y: 0, z: -3 }
}

let program: Program

let gl: WebGL2RenderingContext | undefined

let oscillator: number | any

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

const components: EComponents[] = []

const lightPos = new Float32Array([0, 0, 10])
const shininess = 16
let color : Float32Array = new Float32Array([0.5, 0.5, 0.5])

function setColor (currentColors: number[]) {
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

  const palette: Float32Array[] = currentPalette.map(inner => inner.slice())

  for (let i = 0; i < 12; i++) {
    scale(palette[i], currentColors[i])
  }

  for (let i = 1; i < 12; ++i) {
    addV(palette[0], palette[i])
  }

  color = palette[0]
}

function render (comps: EComponents[], gl: WebGL2RenderingContext, view: Float32Array) {
  const lightDir = lightPos

  comps.forEach(comp => {
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
      projection,
      mv
    ])

    // TODO: why does this work?
    const mn = new Float32Array([mv[0], mv[1], mv[2], mv[4], mv[5], mv[6], mv[8], mv[9], mv[10]])

    gl.useProgram(render.program.id)

    gl.bindVertexArray(render.vao)

    setUniforms(program, { mvp, mv, mn, lightDir, shininess, color })

    gl.drawElements(gl.TRIANGLES, render.count, gl.UNSIGNED_SHORT, 0)
  })
}

function draw (analyser: AnalyserNode, dataArray: Uint8Array, gl: WebGL2RenderingContext, components: EComponents[]) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  // Each item in the array represents the decibel value for a specific
  // frequency. The frequencies are spread linearly from 0 to 1/2 of the sample
  // rate. For example, for 48000 sample rate, the last item of the array will
  // represent the decibel value for 24000 Hz.

  analyser.getByteFrequencyData(dataArray)

  const bms = bmp / 60

  const freq = 1 / bms
  const step = (2 / freq)

  if (playing) {
    const currentTime = audio.currentTime - bmp_offset
    const d = (currentTime % freq)

    for (let i = 0; i < dataArray.length; ++i) {
      components[i].scale.y = (dataArray[i] / 256) * 3
      components[i].position.y = components[i].scale.y - 3

      if (peaks[Math.round(audio.currentTime * 44100)] == 1.0) {
        components[i].scale.z = 0.13
      } else {
        components[i].scale.z = 0.1
      }
    }

    const even = Math.floor(currentTime % (freq / 2)) == 0

    const normalized = d * step

    let pos = 1 - normalized

    if (even) {
      pos *= -1
    }

    pos *= 0.25

    components[oscillator].position.x = pos

    setColor(colors[Math.floor((audio.currentTime * 44100) / 4096)])
  }

  const translation = matrixTrans(cameraTrans.position.x, cameraTrans.position.y, cameraTrans.position.z)

  const rotationX = rotateXMatrix(cameraTrans.rotation.x)
  const rotationY = rotateYMatrix(cameraTrans.rotation.y)
  const rotationZ = rotateZMatrix(cameraTrans.rotation.z)

  const view = matrixArrayMult([translation, rotationX, rotationZ, rotationY])
  render(components, gl, view)

  requestAnimationFrame(() => draw(analyser, dataArray, gl, components))
}

function initWebGL (canvas: HTMLCanvasElement) {
  // Inicializamos el canvas WebGL
  canvas.oncontextmenu = function () { return false }
  const gl = canvas.getContext('webgl2', { antialias: false, depth: true })
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
window.onload = function () {
  const canvas = document.getElementById('view') as HTMLCanvasElement

  extract_beat().then(result => {
    const guess = result.tempoEstimation
    console.log(guess)

    bmp = guess.tempo
    bmp_offset = guess.offset

    colors = result.colors
    peaks = result.peaks

    const blob = new Blob([result.rawBuffer], { type: 'audio/mp3' })
    const url = window.URL.createObjectURL(blob)

    audio.src = url
    audio.controls = true

    const loadingLabel = document.getElementById('loading') as HTMLLabelElement
    loadingLabel.hidden = true
  })

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

  audio = document.getElementById('audio-source') as HTMLMediaElement
  const track = audioContext.createMediaElementSource(audio)

  const analyser = audioContext.createAnalyser()
  analyser.fftSize = fftSize

  const freqStep = ((audioContext.sampleRate / 2) / analyser.frequencyBinCount)
  const maxFrequency = 5000 / freqStep

  const bufferLength = maxFrequency

  const dataArray = new Uint8Array(bufferLength)

  track.connect(analyser).connect(audioContext.destination)

  const start = -8
  const end = 8
  const step = (end - start) / bufferLength

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

  projection = perspectiveMatrix(canvas.width / canvas.height)
  draw(analyser, dataArray, gl, components)

  audio.addEventListener('play', function () {
    playing = true
  })

  audio.addEventListener('pause', function () {
    playing = false
  })

  canvas.addEventListener('wheel', function (event: WheelEvent) {
    const s = 0.3 * event.deltaY / canvas.height
    cameraTrans.position.z += -s
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

      cameraTrans.rotation.y += -1 * (cx - event.clientX) / (canvas.width * 5)
      cameraTrans.rotation.x += -1 * (cy - event.clientY) / (canvas.height * 5)

      cx = event.clientX
      cy = event.clientY
    }
  })

  for (let i = 0; i < 12; i++) {
    const picker = document.getElementById(`color${i}`) as HTMLInputElement
    const color = currentPalette[i]

    const bytes = []

    for (let j = 0; j < 3; ++j) {
      bytes.push(Math.round(color[j] * 255))
    }

    picker.value = '#' + hex(bytes)

    picker.addEventListener('change', function () {
      const bytes = new Float32Array(hexStringToBytes(picker.value.slice(1)))
      currentPalette[i] = bytes.map(b => b / 256)
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
