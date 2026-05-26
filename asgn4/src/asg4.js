var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Normal = a_Normal;
    v_VertPos = u_ModelMatrix * a_Position;
  }`;

var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;   // sky
  uniform sampler2D u_Sampler1;   // ground / grass
  uniform sampler2D u_Sampler2;   // wall / stone
  uniform sampler2D u_Sampler3;   // accent (e.g. wood, brick — your choice)
  uniform vec3 u_lightPos;
  uniform int u_whichTexture;
  uniform bool u_lightOn;
  uniform vec3 u_cameraPos;

  // ----- Spotlight uniforms -----
  uniform bool  u_spotOn;        // is the spotlight active?
  uniform vec3  u_spotPos;       // spotlight position
  uniform vec3  u_spotDir;       // direction the spotlight aims
  uniform float u_spotCosCutoff; // cosine of the cone half-angle

  void main() {
    if (u_whichTexture == -3) {
      gl_FragColor = vec4((v_Normal + 1.0)/ 2.0, 1.0); 
    } else if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;                       // solid color
    } else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0);              // debug UV
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);       // sky
    } else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);       // ground
    } else if (u_whichTexture == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV);       // wall
    } else if (u_whichTexture == 3) {
      gl_FragColor = texture2D(u_Sampler3, v_UV);       // accent
    } else {
      gl_FragColor = vec4(1, 0.2, 0.2, 1);              // error pink
    }

    vec3 baseColor = vec3(gl_FragColor);
    vec3 N = normalize(v_Normal);
    vec3 E = normalize(u_cameraPos - vec3(v_VertPos));

    // ===== POINT LIGHT (Phong: ambient + diffuse + specular) =====
    vec3 lightVector = u_lightPos - vec3(v_VertPos);
    vec3 L = normalize(lightVector);
    float nDotL = max(dot(N,L), 0.0);
    vec3 R = reflect(-L, N);
    float specular = pow(max(dot(E,R),0.0),10.0);
    vec3 diffuse = baseColor * nDotL * 0.7;
    vec3 ambient = baseColor * 0.2;

    // ===== SPOTLIGHT (point light limited to a cone) =====
    vec3 spotL = normalize(u_spotPos - vec3(v_VertPos));
    // How aligned is the fragment with the cone axis? Compare the aim
    // direction against the direction from the light to the fragment.
    float spotCos = dot(normalize(u_spotDir), -spotL);
    vec3 spotResult = vec3(0.0);
    if (spotCos > u_spotCosCutoff) {
      // Soft edge: fade in from the cutoff toward the cone center.
      float spotFactor = (spotCos - u_spotCosCutoff) / (1.0 - u_spotCosCutoff);
      spotFactor = clamp(spotFactor, 0.0, 1.0);
      float sNDotL = max(dot(N, spotL), 0.0);
      vec3 sR = reflect(-spotL, N);
      float sSpec = pow(max(dot(E, sR), 0.0), 10.0);
      vec3 sDiffuse = baseColor * sNDotL * 0.9;
      spotResult = (sDiffuse + sSpec) * spotFactor;
    }

    // ===== COMBINE =====
    if (u_whichTexture != 0) {     // sky stays unlit
      vec3 result = ambient;
      if (u_lightOn) {
        result += diffuse + specular;
      }
      if (u_spotOn) {
        result += spotResult;
      }
      gl_FragColor = vec4(result, 1.0);
    }
  }`;

// ============================================================
// GLOBALS
// ============================================================
let canvas;
let gl;
let a_Position, u_FragColor, u_ModelMatrix, u_GlobalRotateMatrix;
let u_Size;
let a_UV;
let a_Normal;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_Sampler0, u_Sampler1, u_Sampler2, u_Sampler3;
let u_whichTexture;
let u_cameraPos;
let u_lightOn;
let u_lightPos;

// Spotlight uniform handles
let u_spotOn;
let u_spotPos;
let u_spotDir;
let u_spotCosCutoff;

// Camera angles (kept for any UI sliders still in HTML, mostly unused now)
let g_globalAngleY = 30;
let g_globalAngleX = 10;

// Per-limb angles
let g_frontLegAngle  = 0;
let g_backLegAngle   = 0;
let g_headAngle      = 0;
let g_tailAngle      = 0;
let g_earAngle       = 0;
let g_lowerLegAngle  = 0;
let g_lowerBackAngle = 0;

// Animation toggles
let g_frontLegAnim = false;
let g_backLegAnim  = false;
let g_headAnim     = false;
let g_tailAnim     = false;

// Normal-visualization toggle (Normal On / Normal Off buttons)
let g_normalOn = false;

// Lighting toggles — point light and spotlight are independent
let g_lightOn = true;
let g_spotOn  = true;

// Poke (shift-click) animation state
let g_poking      = false;
let g_pokeStart   = 0;
let g_pokeDuration= 1.8;

// Mouse drag state
let g_mouseDown  = false;
let g_lastMouseX = 0;
let g_lastMouseY = 0;

// Point light position — the moving "dot" (X is animated in updateAnimationAngles)
let g_lightPos = [0,1,-2];

// ----- Spotlight state (separate from the point light) -----
let g_spotPos = [0, 3, 0];      // moved by spotSlideX/Y/Z
let g_spotDir = [0, -1, 0];     // aims straight down
let g_spotAngleDeg = 25;        // cone half-angle in degrees

// Pig colors
const PIG_PINK       = [1.00, 0.71, 0.76, 1.0];
const PIG_DARK_PINK  = [0.92, 0.56, 0.63, 1.0];
const PIG_SNOUT      = [1.00, 0.60, 0.65, 1.0];
const PIG_EAR        = [0.98, 0.52, 0.60, 1.0];
const PIG_EYE        = [0.10, 0.05, 0.10, 1.0];
const PIG_NOSTRIL    = [0.55, 0.18, 0.22, 1.0];
const PIG_HOOF       = [0.45, 0.20, 0.25, 1.0];
const PIG_BELLY      = [1.00, 0.82, 0.84, 1.0];
const PIG_TAIL       = [1.00, 0.65, 0.70, 1.0];


const WORLD_SIZE = 32;
const MAX_HEIGHT = 4;

var g_map = [];
(function buildInitialMap() {
  for (let x = 0; x < WORLD_SIZE; x++) {
    g_map[x] = [];
    for (let z = 0; z < WORLD_SIZE; z++) {
      g_map[x][z] = 0;
    }
  }

  for (let i = 0; i < WORLD_SIZE; i++) {
    g_map[0][i] = 2;
    g_map[WORLD_SIZE - 1][i] = 2;
    g_map[i][0] = 2;
    g_map[i][WORLD_SIZE - 1] = 2;
  }

  g_map[0][0] = 4;
  g_map[0][WORLD_SIZE - 1] = 4;
  g_map[WORLD_SIZE - 1][0] = 4;
  g_map[WORLD_SIZE - 1][WORLD_SIZE - 1] = 4;

  g_map[10][10] = 3;
  g_map[10][14] = 2;
  g_map[14][10] = 2;
  g_map[14][14] = 3;
  g_map[12][12] = 1;


  for (let i = 18; i < 24; i++) g_map[i][20] = 2;
  g_map[21][20] = 3;

  g_map[6][22] = 1;
  g_map[6][23] = 2;
  g_map[6][24] = 3;
  g_map[6][25] = 4;
})();


function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) { console.log('Failed to get WebGL context'); return; }
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to init shaders'); return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) { console.log('Failed to get a_Position'); return; }

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) { console.log('Failed to get a_UV'); return; }

  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) { console.log('Failed to get a_Normal'); return; }

  u_FragColor          = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix        = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  u_ViewMatrix         = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix   = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_Sampler0           = gl.getUniformLocation(gl.program, 'u_Sampler0');
  u_Sampler1           = gl.getUniformLocation(gl.program, 'u_Sampler1');
  u_Sampler2           = gl.getUniformLocation(gl.program, 'u_Sampler2');
  u_Sampler3           = gl.getUniformLocation(gl.program, 'u_Sampler3');
  u_whichTexture       = gl.getUniformLocation(gl.program, 'u_whichTexture');
  u_lightPos           = gl.getUniformLocation(gl.program, 'u_lightPos');
  u_cameraPos          = gl.getUniformLocation(gl.program, 'u_cameraPos');
  u_lightOn            = gl.getUniformLocation(gl.program, 'u_lightOn');

  // Spotlight uniforms
  u_spotOn        = gl.getUniformLocation(gl.program, 'u_spotOn');
  u_spotPos       = gl.getUniformLocation(gl.program, 'u_spotPos');
  u_spotDir       = gl.getUniformLocation(gl.program, 'u_spotDir');
  u_spotCosCutoff = gl.getUniformLocation(gl.program, 'u_spotCosCutoff');

  var id = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, id.elements);
}


function addActionsForHtmlUI() {
  // Normal-visualization buttons
  document.getElementById('normalOn').onclick  = function() { g_normalOn = true;  };
  document.getElementById('normalOff').onclick = function() { g_normalOn = false; };

  // Point light on/off
  document.getElementById('lightOn').onclick  = function() { g_lightOn = true;  };
  document.getElementById('lightOff').onclick = function() { g_lightOn = false; };

  // Spotlight on/off (guarded so missing HTML doesn't crash)
  var spotOnBtn  = document.getElementById('spotOn');
  if (spotOnBtn)  spotOnBtn.onclick  = function() { g_spotOn = true;  };
  var spotOffBtn = document.getElementById('spotOff');
  if (spotOffBtn) spotOffBtn.onclick = function() { g_spotOn = false; };

  // Pig limb animation toggles
  document.getElementById('animationYellowOnButton').onclick  = () => g_frontLegAnim = true;
  document.getElementById('animationYellowOffButton').onclick = () => g_frontLegAnim = false;
  document.getElementById('animationMagentaOnButton').onclick  = () => g_backLegAnim = true;
  document.getElementById('animationMagentaOffButton').onclick = () => g_backLegAnim = false;
  document.getElementById('animationHeadOnButton').onclick  = () => g_headAnim = true;
  document.getElementById('animationHeadOffButton').onclick = () => g_headAnim = false;
  document.getElementById('animationTailOnButton').onclick  = () => g_tailAnim = true;
  document.getElementById('animationTailOffButton').onclick = () => g_tailAnim = false;

  // Point-light position sliders
  document.getElementById('lightSlideX').addEventListener('mousemove', function(ev) { if(ev.buttons == 1) { g_lightPos[0] = this.value/100; renderAllShapes(); } });
  document.getElementById('lightSlideY').addEventListener('mousemove', function(ev) { if(ev.buttons == 1) { g_lightPos[1] = this.value/100; renderAllShapes(); } });
  document.getElementById('lightSlideZ').addEventListener('mousemove', function(ev) { if(ev.buttons == 1) { g_lightPos[2] = this.value/100; renderAllShapes(); } });

  // Spotlight position sliders (guarded)
  var sx = document.getElementById('spotSlideX');
  if (sx) sx.addEventListener('mousemove', function(ev) { if(ev.buttons == 1) { g_spotPos[0] = this.value/100; renderAllShapes(); } });
  var sy = document.getElementById('spotSlideY');
  if (sy) sy.addEventListener('mousemove', function(ev) { if(ev.buttons == 1) { g_spotPos[1] = this.value/100; renderAllShapes(); } });
  var sz = document.getElementById('spotSlideZ');
  if (sz) sz.addEventListener('mousemove', function(ev) { if(ev.buttons == 1) { g_spotPos[2] = this.value/100; renderAllShapes(); } });


  canvas.addEventListener('mousedown', function(ev) {
    if (ev.shiftKey) {
      startPoke();   // Shift-click pokes the pig
      return;
    }
    g_mouseDown = true;
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
  });
  canvas.addEventListener('mouseup',    () => { g_mouseDown = false; });
  canvas.addEventListener('mouseleave', () => { g_mouseDown = false; });
  canvas.addEventListener('mousemove', function(ev) {
    if (!g_mouseDown) return;
    let dx = ev.clientX - g_lastMouseX;
    let dy = ev.clientY - g_lastMouseY;
    g_camera.panLeft(-dx * 0.3);   // horizontal drag = yaw
    g_camera.panUp(-dy * 0.3);     // vertical drag = pitch
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
  });
}


function initTextures() {

  loadTextureUnit('../resources/sky.jpg', 0, u_Sampler0);

  loadTextureUnit('../resources/floor.png', 1, u_Sampler1);

  loadTextureUnit('../resources/block.png', 2, u_Sampler2);

  return true;
}

function loadTextureUnit(src, unitIndex, samplerUniform) {
  var image = new Image();
  image.onload = function() {
    var texture = gl.createTexture();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0 + unitIndex);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(samplerUniform, unitIndex);
  };
  image.onerror = function() {
    console.warn('Texture failed to load: ' + src +
      ' (this is fine — cubes will fall back to solid color)');
  };
  image.src = src;
}

function startPoke() {
  if (g_poking) return;
  g_poking    = true;
  g_pokeStart = performance.now() / 1000.0;
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  initTextures();
  addActionsForHtmlUI();
  document.onkeydown = keydown;
  gl.clearColor(0.53, 0.81, 0.92, 1.0);   // light sky fallback
  requestAnimationFrame(tick);
}

var g_startTime     = performance.now() / 1000.0;
var g_seconds       = 0;
var g_lastFrameTime = performance.now();
var g_fps           = 0;
var g_fpsBuffer     = [];
var g_fpsBufferSize = 30;

function tick() {
  var now   = performance.now();
  var delta = now - g_lastFrameTime;
  g_lastFrameTime = now;

  if (delta > 0) {
    g_fpsBuffer.push(1000 / delta);
    if (g_fpsBuffer.length > g_fpsBufferSize) g_fpsBuffer.shift();
    var sum = 0;
    for (var i = 0; i < g_fpsBuffer.length; i++) sum += g_fpsBuffer[i];
    g_fps = Math.round(sum / g_fpsBuffer.length);
  }

  g_seconds = now / 1000.0 - g_startTime;
  updateAnimationAngles();
  renderAllShapes();
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  let t = g_seconds;

  if (g_poking) {
    let elapsed  = (performance.now() / 1000.0) - g_pokeStart;
    let progress = elapsed / g_pokeDuration;
    if (progress >= 1.0) {
      g_poking = false;
    } else {
      let phase = progress * Math.PI * 4;
      let decay = 1.0 - progress;
      g_headAngle      = -40 * decay * Math.abs(Math.sin(phase * 0.5));
      g_frontLegAngle  =  45 * decay * Math.sin(phase);
      g_backLegAngle   = -45 * decay * Math.sin(phase + Math.PI);
      g_lowerLegAngle  =  35 * decay * Math.abs(Math.sin(phase));
      g_lowerBackAngle =  35 * decay * Math.abs(Math.sin(phase + 1));
      g_tailAngle      =  60 * decay * Math.sin(phase * 2);
      g_earAngle       =  30 * decay * Math.sin(phase * 1.5);
      return;
    }
  }

  if (g_frontLegAnim) {
    g_frontLegAngle = 30 * Math.sin(t * 2.5);
    g_lowerLegAngle = 20 * Math.abs(Math.sin(t * 2.5));
  }
  if (g_backLegAnim) {
    g_backLegAngle   = 30 * Math.sin(t * 2.5 + Math.PI);
    g_lowerBackAngle = 20 * Math.abs(Math.sin(t * 2.5 + Math.PI));
  }
  if (g_headAnim) {
    g_headAngle = 10 * Math.sin(t * 1.2);
  }
  if (g_tailAnim) {
    g_tailAngle = 40 * Math.sin(t * 4.0);
    g_earAngle  = 8  * Math.sin(t * 1.8);
  }

  // The point light "dot" keeps moving on its own (back and forth in X).
  g_lightPos[0] = 2.0 * Math.cos(g_seconds);
}

// ============================================================
var g_camera = new Camera();
// Start the player a bit above the floor, looking into the world.
// Floor is at y = -0.75 (see drawMap/ground), so eye at ~0 is "standing".
g_camera.eye = new Vector3([-3, 0, 0]);
g_camera.at  = new Vector3([0, 0, 0]);
g_camera.up  = new Vector3([0, 1, 0]);

function keydown(ev) {
  if      (ev.keyCode == 87) { g_camera.forward();   } // W
  else if (ev.keyCode == 83) { g_camera.back();      } // S
  else if (ev.keyCode == 65) { g_camera.left();      } // A
  else if (ev.keyCode == 68) { g_camera.right();     } // D
  else if (ev.keyCode == 81) { g_camera.panLeft(5);  } // Q — turn left
  else if (ev.keyCode == 69) { g_camera.panRight(5); } // E — turn right
  else if (ev.keyCode == 70) { addBlockInFront();    } // F — add block in front
  else if (ev.keyCode == 71) { deleteBlockInFront(); } // G — delete block in front
}


function getCellInFront() {
  let dx = g_camera.at.elements[0] - g_camera.eye.elements[0];
  let dz = g_camera.at.elements[2] - g_camera.eye.elements[2];
  let len = Math.sqrt(dx*dx + dz*dz);
  if (len < 0.0001) return null;
  dx /= len; dz /= len;

  const REACH = 1.5;
  let wx = g_camera.eye.elements[0] + dx * REACH;
  let wz = g_camera.eye.elements[2] + dz * REACH;

  let i = Math.round(wx + WORLD_SIZE / 2);
  let j = Math.round(wz + WORLD_SIZE / 2);

  if (i < 0 || i >= WORLD_SIZE || j < 0 || j >= WORLD_SIZE) return null;
  return { i, j };
}

function addBlockInFront() {
  let cell = getCellInFront();
  if (!cell) return;
  if (g_map[cell.i][cell.j] < MAX_HEIGHT) {
    g_map[cell.i][cell.j] += 1;
    markWorldDirty();
  }
}

function deleteBlockInFront() {
  let cell = getCellInFront();
  if (!cell) return;
  if (g_map[cell.i][cell.j] > 0) {
    g_map[cell.i][cell.j] -= 1;
    markWorldDirty();
  }
}

function renderAllShapes() {
  var startTime = performance.now();

  var identity = new Matrix4();
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, identity.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Projection
  var projMat = new Matrix4();
  projMat.setPerspective(60, canvas.width / canvas.height, 0.1, 1000);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  // View
  var viewMat = new Matrix4();
  viewMat.setLookAt(
    g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2],
    g_camera.at.elements[0],  g_camera.at.elements[1],  g_camera.at.elements[2],
    g_camera.up.elements[0],  g_camera.up.elements[1],  g_camera.up.elements[2]
  );
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  // ----- Sky (large cube centered on player) -----
  var sky = new Cube();
  sky.color = [0.53, 0.81, 0.92, 1.0];
  sky.textureNum = 0;                       // sky texture
  sky.matrix.scale(200, 200, 200);
  sky.matrix.translate(-0.5, -0.5, -0.5);
  sky.renderfastNormal();

  // ----- Ground (flat scaled cube under the world) -----
  var ground = new Cube();
  ground.color = [0.4, 0.7, 0.3, 1.0];
  ground.textureNum = 1;                    // ground texture
  ground.matrix.translate(-WORLD_SIZE/2, -0.76, -WORLD_SIZE/2);
  ground.matrix.scale(WORLD_SIZE, 0.01, WORLD_SIZE);
  ground.renderfastNormal();

  // pass point light
  gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);

  // pass camera
  gl.uniform3f(u_cameraPos,
    g_camera.eye.elements[0],
    g_camera.eye.elements[1],
    g_camera.eye.elements[2]);

  // pass point-light status
  gl.uniform1i(u_lightOn, g_lightOn);

  // pass spotlight (position, aim direction, cone cutoff as cosine, on/off)
  gl.uniform1i(u_spotOn, g_spotOn);
  gl.uniform3f(u_spotPos, g_spotPos[0], g_spotPos[1], g_spotPos[2]);
  gl.uniform3f(u_spotDir, g_spotDir[0], g_spotDir[1], g_spotDir[2]);
  gl.uniform1f(u_spotCosCutoff, Math.cos(g_spotAngleDeg * Math.PI / 180));

  // ----- Point light marker (yellow cube) — shows where the dot is -----
  var light = new Cube();
  light.color = [2, 2, 0, 1];
  light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  light.matrix.scale(0.1, 0.1, 0.1);
  light.matrix.translate(-0.5, -0.5, -0.5);
  light.render();

  // ----- Spotlight marker (cyan cube) — shows where the spotlight is -----
  var spot = new Cube();
  spot.color = [0, 2, 2, 1];
  spot.matrix.translate(g_spotPos[0], g_spotPos[1], g_spotPos[2]);
  spot.matrix.scale(0.12, 0.12, 0.12);
  spot.matrix.translate(-0.5, -0.5, -0.5);
  spot.render();

  drawMap();


  drawPig();

  var duration = performance.now() - startTime;
  sendTextToHTML(
    " ms: " + Math.floor(duration) + " | fps: " + g_fps +
    " | WASD move, QE turn, drag mouse to look, F add, G delete, Shift+click pig" +
    (g_poking ? " -- OUCH!" : "") +
    (g_normalOn ? " | NORMALS ON" : "") +
    (g_lightOn ? " | LIGHT ON" : " | LIGHT OFF") +
    (g_spotOn ? " | SPOT ON" : " | SPOT OFF"),
    "numdot"
  );
}

function drawMap() {
  // The entire world is now one batched mesh, rebuilt only when the
  // map changes. This is a single draw call instead of ~2000.
  drawWorldBatched();
}


function drawPig() {
  var body = new Cube();
  body.color = PIG_PINK;
  body.matrix.translate(-0.30, -0.20, -0.35);
  body.matrix.scale(0.60, 0.40, 0.65);
  body.render();

  var belly = new Cube();
  belly.color = PIG_BELLY;
  belly.matrix.translate(-0.20, -0.19, -0.15);
  belly.matrix.scale(0.40, 0.01, 0.35);
  belly.render();

  var headMat = new Matrix4();
  headMat.translate(0.30, 0.10, -0.18);
  headMat.rotate(g_headAngle, 0, 1, 0);

  var head = new Cube();
  head.color = PIG_PINK;
  head.matrix = new Matrix4(headMat);
  head.matrix.translate(0, -0.01, -0.01);
  head.matrix.scale(0.32, 0.30, 0.30);
  head.render();

  drawEye(headMat, false);
  drawEye(headMat, true);

  var snout = new Cylinder(10);
  snout.color = PIG_SNOUT;
  snout.matrix = new Matrix4(headMat);
  snout.matrix.translate(0.28, 0.04, 0.2);
  snout.matrix.rotate(90, 0, 1, 0);
  snout.matrix.scale(0.12, 0.08, 0.12);
  snout.render();

  drawNostril(headMat, -0.04);
  drawNostril(headMat,  0.04);

  drawEar(headMat, true);
  drawEar(headMat, false);

  var tailBaseMat = new Matrix4();
  tailBaseMat.translate(-0.28, 0.20, -0.08);
  tailBaseMat.rotate(g_tailAngle, 0, 1, 0);

  var tailSeg1 = new Cube();
  tailSeg1.color = PIG_TAIL;
  tailSeg1.matrix = new Matrix4(tailBaseMat);
  tailSeg1.matrix.translate(-0.05, 0, 0);
  tailSeg1.matrix.rotate(-30, 0, 0, 1);
  tailSeg1.matrix.scale(0.06, 0.14, 0.06);
  tailSeg1.render();

  var tail2Mat = new Matrix4(tailBaseMat);
  tail2Mat.translate(-0.03, 0.08, 0);
  tail2Mat.rotate(45, 0, 0, 1);

  var tailSeg2 = new Cube();
  tailSeg2.color = PIG_DARK_PINK;
  tailSeg2.matrix = new Matrix4(tail2Mat);
  tailSeg2.matrix.scale(0.05, 0.10, 0.05);
  tailSeg2.render();

  drawLeg( 0.16, -0.20, -0.24, g_frontLegAngle,  g_lowerLegAngle, true);
  drawLeg( 0.16, -0.20,  0.08, -g_frontLegAngle, g_lowerLegAngle, true);
  drawLeg(-0.20, -0.20, -0.24, g_backLegAngle,   g_lowerBackAngle, false);
  drawLeg(-0.20, -0.20,  0.08, -g_backLegAngle,  g_lowerBackAngle, false);

  // ----- A sphere floating above the pig (easy to see lighting on) -----
  var ball = new Sphere();
  ball.textureNum = g_normalOn ? -3 : -2;   // <-- normal toggle support
  ball.color = [0.4, 0.6, 1.0, 1.0];
  ball.matrix.translate(0, 0.7, 0);   // position it
  ball.matrix.scale(0.25, 0.25, 0.25); // unit sphere is radius 1 — shrink it
  ball.render();
}

function drawLeg(x, y, z, upperAngle, lowerAngle, isFront) {
  var upperMat = new Matrix4();
  upperMat.translate(x, y, z);
  upperMat.rotate(upperAngle, 0, 0, 1);

  var upper = new Cube();
  upper.color = PIG_DARK_PINK;
  upper.matrix = new Matrix4(upperMat);
  upper.matrix.scale(0.12, 0.18, 0.12);
  upper.render();

  var lowerMat = new Matrix4(upperMat);
  lowerMat.translate(0, -0.18, 0);
  lowerMat.rotate(lowerAngle, 0, 0, 1);

  var lower = new Cube();
  lower.color = PIG_PINK;
  lower.matrix = new Matrix4(lowerMat);
  lower.matrix.scale(0.11, 0.16, 0.11);
  lower.render();

  var hoofMat = new Matrix4(lowerMat);
  hoofMat.translate(0, -0.08, -0.01);
  hoofMat.rotate(isFront ? 5 : -5, 0, 0, 1);

  var hoof = new Cube();
  hoof.color = PIG_HOOF;
  hoof.matrix = new Matrix4(hoofMat);
  hoof.matrix.scale(0.13, 0.07, 0.13);
  hoof.render();
}

function drawEye(headMat, isRight) {
  var eye = new Cube();
  eye.color = PIG_EYE;
  eye.matrix = new Matrix4(headMat);
  var zOff = isRight ? 0.19 : 0.04;
  eye.matrix.translate(0.30, 0.14, zOff);
  eye.matrix.scale(0.04, 0.05, 0.04);
  eye.render();
}

function drawNostril(headMat, zOffset) {
  var n = new Cube();
  n.color = PIG_NOSTRIL;
  n.matrix = new Matrix4(headMat);
  n.matrix.translate(0.37, 0.06, 0.12 + zOffset);
  n.matrix.scale(0.025, 0.025, 0.025);
  n.render();
}

function drawEar(headMat, isLeft) {
  var zOff = isLeft ? 0.02 : 0.20;
  var flopDir = isLeft ? 1 : -1;

  var earBaseMat = new Matrix4(headMat);
  earBaseMat.translate(0.10, 0.28, zOff);
  earBaseMat.rotate(flopDir * g_earAngle, 1, 0, 0);

  var earBase = new Cube();
  earBase.color = PIG_EAR;
  earBase.matrix = new Matrix4(earBaseMat);
  earBase.matrix.scale(0.10, 0.12, 0.08);
  earBase.render();
}

function sendTextToHTML(text, htmlID) {
  var el = document.getElementById(htmlID);
  if (!el) return;
  el.innerHTML = text;
}