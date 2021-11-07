export function initShaders (vsSource: string, fsSource: string, wgl: WebGLRenderingContext): WebGLProgram {
  // Función que compila cada shader individualmente
  const vs = compileShader(wgl.VERTEX_SHADER, vsSource, wgl)
  const fs = compileShader(wgl.FRAGMENT_SHADER, fsSource, wgl)

  // Crea y linkea el programa
  const prog = wgl.createProgram()
  wgl.attachShader(prog, vs)
  wgl.attachShader(prog, fs)
  wgl.linkProgram(prog)

  if (!wgl.getProgramParameter(prog, wgl.LINK_STATUS)) {
    alert('No se pudo inicializar el programa: ' + wgl.getProgramInfoLog(prog))
    return null
  }
  return prog
}

function compileShader (type: GLenum, source: string, wgl: WebGLRenderingContext) {
  const shader = wgl.createShader(type)

  wgl.shaderSource(shader, source)
  wgl.compileShader(shader)

  if (!wgl.getShaderParameter(shader, wgl.COMPILE_STATUS)) {
    alert('Ocurrió un error durante la compilación del shader:' + wgl.getShaderInfoLog(shader))
    wgl.deleteShader(shader)
    return null
  }

  return shader
}
