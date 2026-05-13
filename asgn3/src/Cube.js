// Cube.js — optimized with shared buffers.
// Buffers are created once; we just re-upload vertex data each draw call.

var g_cubeVertBuffer = null;
var g_cubeUVBuffer   = null;

function initCubeBuffer() {
  g_cubeVertBuffer = gl.createBuffer();
}
function initCubeUVBuffer() {
  g_cubeUVBuffer = gl.createBuffer();
}

class Cube {
  constructor() {
    this.type = 'cube';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.textureNum = -2;
  }

  // Old per-face render with shading (kept for pig). One draw call per triangle.
  render() {
    var rgba = this.color;

    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    drawTriangle3DUV([0,0,0, 1,1,0, 1,0,0], [1,0,  0,1,  1,1]);
    drawTriangle3DUV([0,0,0, 0,1,0, 1,1,0], [0,0,  0,1,  1,1]);

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

  renderfast() {
    var rgba = this.color;
    gl.uniform1i(u_whichTexture, -2);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    var allverts = [];
    allverts = allverts.concat([0,0,0, 1,1,0, 1,0,0]);
    allverts = allverts.concat([0,0,0, 0,1,0, 1,1,0]);
    allverts = allverts.concat([0,0,1, 1,0,1, 1,1,1]);
    allverts = allverts.concat([0,0,1, 1,1,1, 0,1,1]);
    allverts = allverts.concat([0,1,0, 0,1,1, 1,1,1]);
    allverts = allverts.concat([0,1,0, 1,1,1, 1,1,0]);
    allverts = allverts.concat([0,0,0, 1,0,1, 0,0,1]);
    allverts = allverts.concat([0,0,0, 1,0,0, 1,0,1]);
    allverts = allverts.concat([1,0,0, 1,1,1, 1,0,1]);
    allverts = allverts.concat([1,0,0, 1,1,0, 1,1,1]);
    allverts = allverts.concat([0,0,0, 0,0,1, 0,1,1]);
    allverts = allverts.concat([0,0,0, 0,1,1, 0,1,0]);

    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    if (!g_cubeVertBuffer) initCubeBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeVertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(allverts), gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.disableVertexAttribArray(a_UV);

    gl.drawArrays(gl.TRIANGLES, 0, 36);
  }

  renderfastTextured() {
    var rgba = this.color;
    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // Lazy-init the static vertex / uv arrays once
    if (!Cube._verts) {
      Cube._verts = new Float32Array([
        // Front (z=0)
        0,0,0,  1,1,0,  1,0,0,
        0,0,0,  0,1,0,  1,1,0,
        // Back (z=1)
        0,0,1,  1,0,1,  1,1,1,
        0,0,1,  1,1,1,  0,1,1,
        // Top (y=1)
        0,1,0,  0,1,1,  1,1,1,
        0,1,0,  1,1,1,  1,1,0,
        // Bottom (y=0)
        0,0,0,  1,0,1,  0,0,1,
        0,0,0,  1,0,0,  1,0,1,
        // Right (x=1)
        1,0,0,  1,1,1,  1,0,1,
        1,0,0,  1,1,0,  1,1,1,
        // Left (x=0)
        0,0,0,  0,0,1,  0,1,1,
        0,0,0,  0,1,1,  0,1,0,
      ]);
      // UVs: every face gets a full 0..1 square, ordered to match each
      // face's triangle winding above.
      Cube._uvs = new Float32Array([
        // Front
        0,0,  1,1,  1,0,
        0,0,  0,1,  1,1,
        // Back
        1,0,  0,0,  0,1,
        1,0,  0,1,  1,1,
        // Top
        0,0,  0,1,  1,1,
        0,0,  1,1,  1,0,
        // Bottom
        0,1,  1,0,  0,0,
        0,1,  1,1,  1,0,
        // Right
        0,0,  1,1,  0,1,
        0,0,  1,0,  1,1,
        // Left
        1,0,  0,0,  0,1,
        1,0,  0,1,  1,1,
      ]);
    }

    if (!g_cubeVertBuffer) initCubeBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeVertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Cube._verts, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    if (!g_cubeUVBuffer) initCubeUVBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeUVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Cube._uvs, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    gl.drawArrays(gl.TRIANGLES, 0, 36);
  }
}


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