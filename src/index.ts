import song from './everybody.mp3'
import fshader from './shaders/fragment.glsl'
import vshader from './shaders/vertex.glsl'
import { newSquare, RenderComponent } from './square'
import {
  rotateXMatrix, rotateYMatrix, rotateZMatrix, matrixTrans, matrixScale,
  perspectiveMatrix, id, matrixArrayMult
} from
  './algebra'
import { initShaders } from './shader_helpers'

let projection = id
const audioContext = new window.AudioContext()

const cameraTrans:  {
    rotation: RotationComponent,
    position: PositionComponent,
} = {
    rotation: { x:0, y:0, z:0 },
    position: { x:0, y:0, z:0 }
}

let program: Program

let gl: WebGL2RenderingContext | undefined

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
  render: RenderComponent,
  position: PositionComponent,
  rotation: RotationComponent,
  scale: ScaleComponent,
}

const components: EComponents[] = []

function render (comps: EComponents[], gl: WebGL2RenderingContext, view: Float32Array) {
  comps.forEach(comp => {
    const render = comp.render

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

    // console.log(mvp)

    // setUniforms(program, {
    //   scale, rotationX, rotationY, rotationZ, translation, projection
    // })

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
  // TODO: what's the sample rate?
  // analyser.getByteFrequencyData(dataArray)

  const translation = matrixTrans(cameraTrans.position.x, cameraTrans.position.y, cameraTrans.position.z)

  const rotationX = rotateXMatrix(cameraTrans.rotation.x)
  const rotationY = rotateYMatrix(cameraTrans.rotation.y)
  const rotationZ = rotateZMatrix(cameraTrans.rotation.z)

  const view = matrixArrayMult([translation, rotationX, rotationY, rotationZ]) 
  render(components, gl, view)

  // update state of all entities for next frame, could also be done at the
  // beginning, not sure what's better
  components[0].rotation.x = (components[0].rotation.x + 0.001) % (2 * Math.PI)
  components[0].rotation.y = (components[0].rotation.y + 0.001) % (2 * Math.PI)
  components[0].rotation.z = (components[0].rotation.z + 0.001) % (2 * Math.PI)

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

  components.push({
    render: newSquare(gl, program),
    position: { x: 0, y: 0, z: -3 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 0.5, y: 1, z: 1 }
  })

  let transZ = 4.20

  console.log(`sample rate: ${audioContext.sampleRate}`)

  const audio = document.getElementById('audio-source') as HTMLMediaElement
  const track = audioContext.createMediaElementSource(audio)

  const analyser = audioContext.createAnalyser()
  analyser.fftSize = 2048
  // analyser.fftSize = 4096

  const bufferLength = analyser.fftSize
  const dataArray = new Uint8Array(bufferLength)

  track.connect(analyser).connect(audioContext.destination)

  projection = perspectiveMatrix(canvas.width / canvas.height)

  draw(analyser, dataArray, gl, components)

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

  // SetShininess(document.getElementById('shininess-exp'))
}

function htmlComponents () {
  const audio = document.createElement('audio')

  audio.src = song
  audio.controls = true
  audio.id = 'audio-source'

  // const audioContext = new window.AudioContext()

  return [audio]
}

htmlComponents().forEach(c => {
  document.body.appendChild(c)
})
