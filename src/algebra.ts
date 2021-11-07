export const id = new Float32Array([
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1
])

// Multiplica 2 matrices y devuelve A*B.
// Los argumentos y el resultado son arreglos que representan matrices en orden column-major
export function matrixMult (a: Float32Array, b: Float32Array) {
  const C = []
  for (let i = 0; i < 4; ++i) {
    for (let j = 0; j < 4; ++j) {
      let v = 0
      for (let k = 0; k < 4; ++k) {
        v += a[j + 4 * k] * b[k + 4 * i]
      }

      C.push(v)
    }
  }
  return new Float32Array(C)
}

export function matrixArrayMult (matrices: Float32Array[]) {
  let curr = matrices[0]
  for (let i = 1; i < matrices.length; i++) {
    curr = matrixMult(curr, matrices[i])
  }

  return curr
}

export function matrixScale (x: number, y:number, z:number) : Float32Array {
  return new Float32Array([
    x, 0, 0, 0,
    0, y, 0, 0,
    0, 0, z, 0,
    0, 0, 0, 1
  ])
}

export function matrixTrans (x: number, y: number, z: number): Float32Array {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1
  ])
}

export function perspectiveMatrix (aspectRatio: number, fieldOfViewInRadians: number = Math.PI * 0.5, near: number = 1, far: number = 50) {
  const f = 1.0 / Math.tan(fieldOfViewInRadians / 2)
  const rangeInv = 1 / (near - far)

  return new Float32Array([
    f / aspectRatio, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, near * far * rangeInv * 2, 0
  ])
}

export function rotateXMatrix (a: number) {
  const cos = Math.cos(a)
  const sin = Math.sin(a)

  return new Float32Array([
    1, 0, 0, 0,
    0, cos, -sin, 0,
    0, sin, cos, 0,
    0, 0, 0, 1
  ])
}

export function rotateYMatrix (a: number) {
  const cos = Math.cos(a)
  const sin = Math.sin(a)

  return new Float32Array([
    cos, 0, sin, 0,
    0, 1, 0, 0,
    -sin, 0, cos, 0,
    0, 0, 0, 1
  ])
}

export function rotateZMatrix (a: number) {
  const cos = Math.cos(a)
  const sin = Math.sin(a)

  return new Float32Array([
    cos, -sin, 0, 0,
    sin, cos, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ])
}
