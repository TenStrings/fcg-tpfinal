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

const audioContext = new window.AudioContext()
const fftSize = 256
let playing = false
let audio: HTMLMediaElement | undefined

let bmp: number | undefined
let bmp_offset: number | undefined

let projection = id

const cameraTrans: {
    rotation: RotationComponent,
    position: PositionComponent,
} = {
  rotation: { x: 0, y: 0, z: 0 },
  position: { x: 0, y: 0, z: 0 }
}

let program: Program

let gl: WebGL2RenderingContext | undefined

let oscillator: number | any

export type Program = {
  id: WebGLProgram,
  uniforms: UniformLocations,
}

type UniformsK = 'mvp'

type UniformLocations = Record<UniformsK, WebGLUniformLocation>
type UniformValues = Record<UniformsK, Float32Array>

function setUniforms (p: Program, values: UniformValues) {
  gl.uniformMatrix4fv(p.uniforms.mvp, false, values.mvp)
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

function render (comps: EComponents[], gl: WebGL2RenderingContext, view: Float32Array) {
  comps.forEach(comp => {
    const render = primitives[comp.render]

    const scale = matrixScale(comp.scale.x, comp.scale.y, comp.scale.z)

    const translation = matrixTrans(comp.position.x, comp.position.y, comp.position.z)

    const rotationX = rotateXMatrix(comp.rotation.x)
    const rotationY = rotateYMatrix(comp.rotation.y)
    const rotationZ = rotateZMatrix(comp.rotation.z)

    const mvp = matrixArrayMult([
      projection,
      view,
      translation,
      rotationX,
      rotationY,
      rotationZ,
      scale
    ])

    gl.useProgram(render.program.id)

    gl.bindVertexArray(render.vao)

    setUniforms(program, { mvp })

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

      if (d < 0.1) {
        components[i].scale.z = 0.12
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

    // if (d == 0) {
    //   console.log(`currentTime is ${currentTime}`)
    //   console.log(`bms is ${bms}`)
    // }
    // console.log(`d is ${d}`)
    // console.log(`normalized is ${normalized}`)
    // console.log(`pos is ${pos}`)

    components[oscillator].position.x = pos
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
  console.log(canvas.width)
  console.log(canvas.height)
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

    console.log('creating blob')

    console.log(result.rawBuffer)
    const blob = new Blob([result.rawBuffer], { type: 'audio/mp3' })
    const url = window.URL.createObjectURL(blob)

    console.log('setting blob as src')

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
      mvp: gl.getUniformLocation(programId, 'mvp')
    }
  }

  updateCanvasSize(gl, canvas)

  gl.clear(gl.COLOR_BUFFER_BIT)

  primitives.cube = cubeVAO(gl, program)

  console.log(`sample rate: ${audioContext.sampleRate}`)

  audio = document.getElementById('audio-source') as HTMLMediaElement
  const track = audioContext.createMediaElementSource(audio)

  const analyser = audioContext.createAnalyser()
  analyser.fftSize = fftSize

  const freqStep = ((audioContext.sampleRate / 2) / analyser.frequencyBinCount)
  console.log(`the other freqStep is ${freqStep}`)
  const maxFrequency = 5000 / freqStep

  const bufferLength = maxFrequency

  const dataArray = new Uint8Array(bufferLength)

  track.connect(analyser).connect(audioContext.destination)

  const start = -8
  const end = 8
  const step = (end - start) / bufferLength

  for (let i = 0; i < bufferLength; ++i) {
    const pos = start + (step * i)
    components.push({
      render: 'cube',
      position: { x: pos, y: 0, z: -5 },
      rotation: { x: 0 * Math.PI, y: (3 / 2) * Math.PI, z: 0 * Math.PI },
      scale: { x: 0.09, y: 0, z: 0.1 }
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

  // Si se mueve el mouse, actualizo las matrices de rotación
  canvas.addEventListener('mousemove', function (event) {
    if (mouseDown !== undefined) {
      let { cx, cy } = mouseDown

      cameraTrans.rotation.y += -1 * (cx - event.clientX) / (canvas.width * 5)
      cameraTrans.rotation.x += -1 * (cy - event.clientY) / (canvas.height * 5)

      cx = event.clientX
      cy = event.clientY
    }
  })
}

function htmlComponents () {
  const audio = document.createElement('audio')

  audio.src = undefined
  audio.controls = false
  audio.id = 'audio-source'

  return [audio]
}

htmlComponents().forEach(c => {
  document.body.appendChild(c)
})
