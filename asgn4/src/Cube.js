// Cube.js — shared geometry + batched world rendering.

var g_cubeVertBuffer = null;
var g_cubeUVBuffer   = null;

function initCubeBuffer()   { g_cubeVertBuffer = gl.createBuffer(); }
function initCubeUVBuffer() { g_cubeUVBuffer   = gl.createBuffer(); }

class Cube {
  constructor() {
    this.type = 'cube';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.textureNum = -2;
  }

  // Per-face shaded render (used for the pig).
  render() {
    var rgba = this.color;
    var tex = (typeof g_normalOn !== 'undefined' && g_normalOn) ? -3 : this.textureNum;
    gl.uniform1i(u_whichTexture, tex);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    drawTriangle3DUV([0,0,0, 1,1,0, 1,0,0], [1,0,  0,1,  1,1]);
    drawTriangle3DUV([0,0,0, 0,1,0, 1,1,0], [0,0,  0,1,  1,1]);

    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    drawTriangle3DBuffered([0,0,0, 1,1,0, 1,0,0]);
    drawTriangle3DBuffered([0,0,0, 0,1,0, 1,1,0]);
    gl.uniform4f(u_FragColor, rgba[0]*.8, rgba[1]*.8, rgba[2]*.8, rgba[3]);
    drawTriangle3DBuffered([0,0,1, 1,0,1, 1,1,1]);
    drawTriangle3DBuffered([0,0,1, 1,1,1, 0,1,1]);
    gl.uniform4f(u_FragColor, rgba[0]*1.1, rgba[1]*1.1, rgba[2]*1.1, rgba[3]);
    drawTriangle3DBuffered([0,1,0, 0,1,1, 1,1,1]);
    drawTriangle3DBuffered([0,1,0, 1,1,1, 1,1,0]);
    gl.uniform4f(u_FragColor, rgba[0]*.6, rgba[1]*.6, rgba[2]*.6, rgba[3]);
    drawTriangle3DBuffered([0,0,0, 1,0,1, 0,0,1]);
    drawTriangle3DBuffered([0,0,0, 1,0,0, 1,0,1]);
    gl.uniform4f(u_FragColor, rgba[0]*.85, rgba[1]*.85, rgba[2]*.85, rgba[3]);
    drawTriangle3DBuffered([1,0,0, 1,1,1, 1,0,1]);
    drawTriangle3DBuffered([1,0,0, 1,1,0, 1,1,1]);
    gl.uniform4f(u_FragColor, rgba[0]*.7, rgba[1]*.7, rgba[2]*.7, rgba[3]);
    drawTriangle3DBuffered([0,0,0, 0,0,1, 0,1,1]);
    drawTriangle3DBuffered([0,0,0, 0,1,1, 0,1,0]);
  }

  // Single-cube textured + normal render. Used for sky and ground
  // (only a couple of these per frame, so per-call upload is fine).
  renderfastNormal() {
    var rgba = this.color;
    var tex = (typeof g_normalOn !== 'undefined' && g_normalOn) ? -3 : this.textureNum;
    gl.uniform1i(u_whichTexture, tex);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    Cube._initStatic();
    drawTriangle3DUVNormal(Cube._verts, Cube._uvs, Cube._normals);
  }

  // Lazy-init the static per-face geometry for one unit cube.
  static _initStatic() {
    if (Cube._verts) return;

    Cube._verts = new Float32Array([
      0,0,0, 1,1,0, 1,0,0,   0,0,0, 0,1,0, 1,1,0,   // Front  (z=0)
      0,0,1, 1,0,1, 1,1,1,   0,0,1, 1,1,1, 0,1,1,   // Back   (z=1)
      0,1,0, 0,1,1, 1,1,1,   0,1,0, 1,1,1, 1,1,0,   // Top    (y=1)
      0,0,0, 1,0,1, 0,0,1,   0,0,0, 1,0,0, 1,0,1,   // Bottom (y=0)
      1,0,0, 1,1,1, 1,0,1,   1,0,0, 1,1,0, 1,1,1,   // Right  (x=1)
      0,0,0, 0,0,1, 0,1,1,   0,0,0, 0,1,1, 0,1,0,   // Left   (x=0)
    ]);

    Cube._uvs = new Float32Array([
      0,0, 1,1, 1,0,  0,0, 0,1, 1,1,    // Front
      1,0, 0,0, 0,1,  1,0, 0,1, 1,1,    // Back
      0,0, 0,1, 1,1,  0,0, 1,1, 1,0,    // Top
      0,1, 1,0, 0,0,  0,1, 1,1, 1,0,    // Bottom
      0,0, 1,1, 0,1,  0,0, 1,0, 1,1,    // Right
      1,0, 0,0, 0,1,  1,0, 0,1, 1,1,    // Left
    ]);

    Cube._normals = new Float32Array([
      0,0,-1, 0,0,-1, 0,0,-1,  0,0,-1, 0,0,-1, 0,0,-1,   // Front  -> -Z
      0,0,1,  0,0,1,  0,0,1,   0,0,1,  0,0,1,  0,0,1,    // Back   -> +Z
      0,1,0,  0,1,0,  0,1,0,   0,1,0,  0,1,0,  0,1,0,    // Top    -> +Y
      0,-1,0, 0,-1,0, 0,-1,0,  0,-1,0, 0,-1,0, 0,-1,0,   // Bottom -> -Y
      1,0,0,  1,0,0,  1,0,0,   1,0,0,  1,0,0,  1,0,0,    // Right  -> +X
      -1,0,0, -1,0,0, -1,0,0,  -1,0,0, -1,0,0, -1,0,0,   // Left   -> -X
    ]);
  }
}


function drawTriangle3DBuffered(vertices) {
  gl.bindBuffer(gl.ARRAY_BUFFER, getTriPosBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}


// ============================================================
// BATCHED WORLD RENDERER
// All map cubes are merged into ONE set of buffers and drawn with
// ONE draw call. Rebuilt only when the map changes (add/delete block),
// not every frame.
// ============================================================
var g_worldPosBuffer    = null;
var g_worldUVBuffer     = null;
var g_worldNormalBuffer = null;
var g_worldVertCount    = 0;
var g_worldDirty        = true;   // set true to force a rebuild

function markWorldDirty() { g_worldDirty = true; }

function rebuildWorldMesh() {
  Cube._initStatic();

  // Count cubes first so we can allocate exact-size typed arrays.
  var cubeCount = 0;
  for (var x = 0; x < WORLD_SIZE; x++) {
    for (var z = 0; z < WORLD_SIZE; z++) {
      cubeCount += g_map[x][z];   // height = number of stacked cubes
    }
  }

  var floatsPerCubePos = 36 * 3;   // 36 verts, xyz
  var floatsPerCubeUV  = 36 * 2;
  var positions = new Float32Array(cubeCount * floatsPerCubePos);
  var uvs       = new Float32Array(cubeCount * floatsPerCubeUV);
  var normals   = new Float32Array(cubeCount * floatsPerCubePos);

  var pv = Cube._verts, pu = Cube._uvs, pn = Cube._normals;
  var pi = 0, ui = 0, ni = 0;

  for (var x = 0; x < WORLD_SIZE; x++) {
    for (var z = 0; z < WORLD_SIZE; z++) {
      var h = g_map[x][z];
      if (h <= 0) continue;
      var ox = x - WORLD_SIZE / 2;
      var oz = z - WORLD_SIZE / 2;
      for (var y = 0; y < h; y++) {
        var oy = -0.75 + y;
        // Append a translated copy of the unit cube.
        for (var v = 0; v < 36; v++) {
          positions[pi++] = pv[v*3]     + ox;
          positions[pi++] = pv[v*3 + 1] + oy;
          positions[pi++] = pv[v*3 + 2] + oz;

          uvs[ui++] = pu[v*2];
          uvs[ui++] = pu[v*2 + 1];

          normals[ni++] = pn[v*3];
          normals[ni++] = pn[v*3 + 1];
          normals[ni++] = pn[v*3 + 2];
        }
      }
    }
  }

  g_worldVertCount = cubeCount * 36;

  if (!g_worldPosBuffer)    g_worldPosBuffer    = gl.createBuffer();
  if (!g_worldUVBuffer)     g_worldUVBuffer     = gl.createBuffer();
  if (!g_worldNormalBuffer) g_worldNormalBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, g_worldPosBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_worldUVBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_worldNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

  g_worldDirty = false;
}

// Draw the whole world (all map cubes) with a single draw call.
function drawWorldBatched() {
  if (g_worldDirty) rebuildWorldMesh();
  if (g_worldVertCount === 0) return;

  // World cubes share the stone texture (unit 2). Normal mode -> -3.
  var tex = (typeof g_normalOn !== 'undefined' && g_normalOn) ? -3 : 2;
  gl.uniform1i(u_whichTexture, tex);

  // Geometry already baked in world space, so model matrix = identity.
  if (!Cube._identity) Cube._identity = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, Cube._identity.elements);
  gl.uniform4f(u_FragColor, 0.78, 0.76, 0.80, 1.0);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_worldPosBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_worldUVBuffer);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_UV);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_worldNormalBuffer);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);

  gl.drawArrays(gl.TRIANGLES, 0, g_worldVertCount);
}