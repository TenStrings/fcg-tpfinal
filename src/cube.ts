import { Program } from './index'

export type RenderComponent = {
  vao: WebGLVertexArrayObject,
  count: GLsizei,
  program: Program,
}

export function cubeVAO (gl: WebGL2RenderingContext, program: Program): RenderComponent {
  gl.useProgram(program.id)
  const vao = gl.createVertexArray()

  gl.bindVertexArray(vao)

  const vertices = new Float32Array([
    // Front face
    -1.0, -1.0, 1.0,
    1.0, -1.0, 1.0,
    1.0, 1.0, 1.0,
    -1.0, 1.0, 1.0,

    // Back face
    -1.0, -1.0, -1.0,
    -1.0, 1.0, -1.0,
    1.0, 1.0, -1.0,
    1.0, -1.0, -1.0,

    // Top face
    -1.0, 1.0, -1.0,
    -1.0, 1.0, 1.0,
    1.0, 1.0, 1.0,
    1.0, 1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
    1.0, -1.0, -1.0,
    1.0, -1.0, 1.0,
    -1.0, -1.0, 1.0,

    // Right face
    1.0, -1.0, -1.0,
    1.0, 1.0, -1.0,
    1.0, 1.0, 1.0,
    1.0, -1.0, 1.0,

    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0, 1.0,
    -1.0, 1.0, 1.0,
    -1.0, 1.0, -1.0
  ])

  const vbo_buffer_id = gl.createBuffer()

  gl.bindBuffer(gl.ARRAY_BUFFER, vbo_buffer_id)

  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW, 0)

  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)

  gl.enableVertexAttribArray(0)

  const faceColors = [
    [1.0, 1.0, 1.0, 1.0], // Front face: white
    [1.0, 0.0, 0.0, 1.0], // Back face: red
    [0.0, 1.0, 0.0, 1.0], // Top face: green
    [0.0, 0.0, 1.0, 1.0], // Bottom face: blue
    [1.0, 1.0, 0.0, 1.0], // Right face: yellow
    [1.0, 0.0, 1.0, 1.0] // Left face: purple
  ]

  // Convert the array of colors into a table for all the vertices.

  let colors: number[] = []

  for (let j = 0; j < faceColors.length; ++j) {
    const c = faceColors[j]

    // Repeat each color four times for the four vertices of the face
    colors = colors.concat(c, c, c, c)
  }

  const colorBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)

  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(1)

  // normals
  const vertexNormals = [
    // Front
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,

    // Back
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,

    // Top
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,

    // Bottom
    0.0, -1.0, 0.0,
    0.0, -1.0, 0.0,
    0.0, -1.0, 0.0,
    0.0, -1.0, 0.0,

    // Right
    1.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
    1.0, 0.0, 0.0,

    // Left
    -1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0
  ]

  const normalBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals),
    gl.STATIC_DRAW)

  gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(2)

  const indices = [
    0, 1, 2, 0, 2, 3, // front
    4, 5, 6, 4, 6, 7, // back
    8, 9, 10, 8, 10, 11, // top
    12, 13, 14, 12, 14, 15, // bottom
    16, 17, 18, 16, 18, 19, // right
    20, 21, 22, 20, 22, 23 // left
  ]

  const ebo_buffer_id = gl.createBuffer()

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo_buffer_id)

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW, 0)

  return {
    vao, count: indices.length, program
  }
}
