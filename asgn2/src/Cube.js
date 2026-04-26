// Cube.js — optimized with a single shared buffer
// Buffer is created once; we just re-upload vertex data each draw call.

var g_cubeVertBuffer = null;

function initCubeBuffer() {
  g_cubeVertBuffer = gl.createBuffer();
}

class Cube {
  constructor() {
    this.type = 'cube';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
  }

  // Draw cube using shared buffer; color shading per-face.
  render() {
    var rgba = this.color;
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // Front face
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    drawTriangle3DBuffered([0,0,0, 1,1,0, 1,0,0]);
    drawTriangle3DBuffered([0,0,0, 0,1,0, 1,1,0]);
    // Back face (slightly darker)
    gl.uniform4f(u_FragColor, rgba[0]*.8, rgba[1]*.8, rgba[2]*.8, rgba[3]);
    drawTriangle3DBuffered([0,0,1, 1,0,1, 1,1,1]);
    drawTriangle3DBuffered([0,0,1, 1,1,1, 0,1,1]);
    // Top face
    gl.uniform4f(u_FragColor, rgba[0]*1.1, rgba[1]*1.1, rgba[2]*1.1, rgba[3]);
    drawTriangle3DBuffered([0,1,0, 0,1,1, 1,1,1]);
    drawTriangle3DBuffered([0,1,0, 1,1,1, 1,1,0]);
    // Bottom face
    gl.uniform4f(u_FragColor, rgba[0]*.6, rgba[1]*.6, rgba[2]*.6, rgba[3]);
    drawTriangle3DBuffered([0,0,0, 1,0,1, 0,0,1]);
    drawTriangle3DBuffered([0,0,0, 1,0,0, 1,0,1]);
    // Right face
    gl.uniform4f(u_FragColor, rgba[0]*.85, rgba[1]*.85, rgba[2]*.85, rgba[3]);
    drawTriangle3DBuffered([1,0,0, 1,1,1, 1,0,1]);
    drawTriangle3DBuffered([1,0,0, 1,1,0, 1,1,1]);
    // Left face
    gl.uniform4f(u_FragColor, rgba[0]*.7, rgba[1]*.7, rgba[2]*.7, rgba[3]);
    drawTriangle3DBuffered([0,0,0, 0,0,1, 0,1,1]);
    drawTriangle3DBuffered([0,0,0, 0,1,1, 0,1,0]);
  }
}

// Shared buffer draw — reuse the same WebGL buffer every call
function drawTriangle3DBuffered(vertices) {
  if (!g_cubeVertBuffer) initCubeBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeVertBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// Legacy 2D (kept for compatibility)
function drawTriangle3D(vertices) {
  drawTriangle3DBuffered(vertices);
}