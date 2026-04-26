 
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`;

var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`;

//  Globals 
let canvas, gl;
let a_Position, u_FragColor, u_ModelMatrix, u_GlobalRotateMatrix;

// Camera angles (mouse + slider)
let g_globalAngleY = 30;
let g_globalAngleX = 10;

// Per-limb angles
let g_frontLegAngle  = 0;
let g_backLegAngle   = 0;
let g_headAngle      = 0;
let g_tailAngle      = 0;
let g_earAngle       = 0;
let g_lowerLegAngle  = 0;  // third joint: lower leg / hoof
let g_lowerBackAngle = 0;

// Animation toggles
let g_frontLegAnim = false;
let g_backLegAnim  = false;
let g_headAnim     = false;
let g_tailAnim     = false;

// Poke (shift-click) animation state
let g_poking      = false;
let g_pokeStart   = 0;
let g_pokeDuration= 1.8; // seconds

// Mouse drag state
let g_mouseDown  = false;
let g_lastMouseX = 0;
let g_lastMouseY = 0;

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

// Setup 
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
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');

  var id = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, id.elements);
}

function addActionsForHtmlUI() {
  // Front legs
  document.getElementById('animationYellowOnButton').onclick  = () => g_frontLegAnim = true;
  document.getElementById('animationYellowOffButton').onclick = () => g_frontLegAnim = false;
  // Back legs
  document.getElementById('animationMagentaOnButton').onclick  = () => g_backLegAnim = true;
  document.getElementById('animationMagentaOffButton').onclick = () => g_backLegAnim = false;
  // Head
  document.getElementById('animationHeadOnButton').onclick  = () => g_headAnim = true;
  document.getElementById('animationHeadOffButton').onclick = () => g_headAnim = false;
  // Tail
  document.getElementById('animationTailOnButton').onclick  = () => g_tailAnim = true;
  document.getElementById('animationTailOffButton').onclick = () => g_tailAnim = false;

  // Sliders
  document.getElementById('yellowSlide').addEventListener('input', function() {
    g_frontLegAngle = parseFloat(this.value); renderAllShapes();
  });
  document.getElementById('magentaSlide').addEventListener('input', function() {
    g_backLegAngle = parseFloat(this.value); renderAllShapes();
  });
  document.getElementById('headSlide').addEventListener('input', function() {
    g_headAngle = parseFloat(this.value); renderAllShapes();
  });
  document.getElementById('tailSlide').addEventListener('input', function() {
    g_tailAngle = parseFloat(this.value); renderAllShapes();
  });
  document.getElementById('angleSlide').addEventListener('input', function() {
    g_globalAngleY = parseFloat(this.value); renderAllShapes();
  });
  document.getElementById('angleXSlide').addEventListener('input', function() {
    g_globalAngleX = parseFloat(this.value); renderAllShapes();
  });

  // Mouse drag for rotation
  canvas.addEventListener('mousedown', function(ev) {
    if (ev.shiftKey) {
      // Shift-click: poke!
      startPoke();
      return;
    }
    g_mouseDown = true;
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
  });
  canvas.addEventListener('mousemove', function(ev) {
    if (!g_mouseDown) return;
    let dx = ev.clientX - g_lastMouseX;
    let dy = ev.clientY - g_lastMouseY;
    g_globalAngleY += dx * 0.5;
    g_globalAngleX += dy * 0.5;
    g_globalAngleX = Math.max(-80, Math.min(80, g_globalAngleX));
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
  });
  canvas.addEventListener('mouseup',   () => g_mouseDown = false);
  canvas.addEventListener('mouseleave',() => g_mouseDown = false);
}

function startPoke() {
  if (g_poking) return;
  g_poking    = true;
  g_pokeStart = performance.now() / 1000.0;
}

// Main 
function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();
  gl.clearColor(0.06, 0.02, 0.05, 1.0);
  requestAnimationFrame(tick);
}

var g_startTime     = performance.now() / 1000.0;
var g_seconds       = 0;
var g_lastFrameTime = performance.now();
var g_fps           = 0;

function tick() {
  var now   = performance.now();
  var delta = now - g_lastFrameTime;
  g_fps         = delta > 0 ? Math.round(1000 / delta) : 0;
  g_lastFrameTime = now;

  g_seconds = now / 1000.0 - g_startTime;
  updateAnimationAngles();
  renderAllShapes();
  requestAnimationFrame(tick);
}

// Animation 
function updateAnimationAngles() {
  let t = g_seconds;

  if (g_poking) {
    // Poke animation: pig reacts — head bobs down, legs flail, ears flop
    let elapsed = (performance.now() / 1000.0) - g_pokeStart;
    let progress = elapsed / g_pokeDuration;
    if (progress >= 1.0) {
      g_poking = false;
    } else {
      // Dramatic flinch sequence
      let phase = progress * Math.PI * 4; // ~4 oscillations
      let decay = 1.0 - progress;
      g_headAngle      = -40 * decay * Math.abs(Math.sin(phase * 0.5));
      g_frontLegAngle  =  45 * decay * Math.sin(phase);
      g_backLegAngle   = -45 * decay * Math.sin(phase + Math.PI);
      g_lowerLegAngle  =  35 * decay * Math.abs(Math.sin(phase));
      g_lowerBackAngle =  35 * decay * Math.abs(Math.sin(phase + 1));
      g_tailAngle      =  60 * decay * Math.sin(phase * 2);
      g_earAngle       =  30 * decay * Math.sin(phase * 1.5);
      return; // skip normal animation
    }
  }

  // Normal idle / walk animation
  if (g_frontLegAnim) {
    g_frontLegAngle = 30 * Math.sin(t * 2.5);
    g_lowerLegAngle = 20 * Math.abs(Math.sin(t * 2.5)); // knee always bends forward
  }
  if (g_backLegAnim) {
    g_backLegAngle   = 30 * Math.sin(t * 2.5 + Math.PI); // opposite phase = walk
    g_lowerBackAngle = 20 * Math.abs(Math.sin(t * 2.5 + Math.PI));
  }
  if (g_headAnim) {
    g_headAngle = 10 * Math.sin(t * 1.2);
  }
  if (g_tailAnim) {
    g_tailAngle = 40 * Math.sin(t * 4.0); // fast wag!
    g_earAngle  = 8  * Math.sin(t * 1.8);
  }
}

// Rendering 
function renderAllShapes() {
  var startTime = performance.now();

  // Global camera
  var rotY = new Matrix4().rotate(g_globalAngleY, 0, 1, 0);
  var rotX = new Matrix4().rotate(g_globalAngleX, 1, 0, 0);
  var globalRotMat = rotX.multiply(rotY);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  drawPig();

  var duration = performance.now() - startTime;
  sendTextToHTML(
    " ms: " + Math.floor(duration) + " fps: " + g_fps +
    (g_poking ? " -- OUCH!" : ""),
    "numdot"
  );
}

// Pig Drawing 
function drawPig() {

  // Body 
  var body = new Cube();
  body.color = PIG_PINK;
  body.matrix.translate(-0.30, -0.20, -0.35);
  body.matrix.scale(0.60, 0.40, 0.65);
  body.render();

  // Belly highlight
  var belly = new Cube();
  belly.color = PIG_BELLY;
  belly.matrix.translate(-0.20, -0.19, -0.15);
  belly.matrix.scale(0.40, 0.01, 0.35);
  belly.render();

  // Head 
  var headMat = new Matrix4();
  headMat.translate(0.30, 0.10, -0.18);
  headMat.rotate(g_headAngle, 0, 1, 0);

  var head = new Cube();
  head.color = PIG_PINK;
  head.matrix = new Matrix4(headMat);
  head.matrix.translate(0, -0.01, -0.01);
  head.matrix.scale(0.32, 0.30, 0.30);
  head.render();

  // Eyes (left & right)
  drawEye(headMat, false);
  drawEye(headMat, true);

  // Snout — cylinder primitive!
  var snout = new Cylinder(10);
  snout.color = PIG_SNOUT;
  snout.matrix = new Matrix4(headMat);
  snout.matrix.translate(0.28, 0.04, 0.2);
  snout.matrix.rotate(90, 0, 1, 0);  // rotate so flat face points forward (+X)
  snout.matrix.scale(0.12, 0.08, 0.12);
  snout.render();

  // Nostrils
  drawNostril(headMat, -0.04);
  drawNostril(headMat,  0.04);

  // Ears 
  drawEar(headMat, true);   // left ear
  drawEar(headMat, false);  // right ear

  // Tail 
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

  // Tail segment 2 (curled tip — second joint)
  var tail2Mat = new Matrix4(tailBaseMat);
  tail2Mat.translate(-0.03, 0.08, 0);
  tail2Mat.rotate(45, 0, 0, 1);

  var tailSeg2 = new Cube();
  tailSeg2.color = PIG_DARK_PINK;
  tailSeg2.matrix = new Matrix4(tail2Mat);
  tailSeg2.matrix.scale(0.05, 0.10, 0.05);
  tailSeg2.render();

  // Front Left Leg 
  drawLeg( 0.16, -0.20, -0.24, g_frontLegAngle,  g_lowerLegAngle, true);
  //  Front Right Leg 
  drawLeg( 0.16, -0.20,  0.08, -g_frontLegAngle, g_lowerLegAngle, true);
  //  Back Left Leg 
  drawLeg(-0.20, -0.20, -0.24, g_backLegAngle,   g_lowerBackAngle, false);
  // Back Right Leg 
  drawLeg(-0.20, -0.20,  0.08, -g_backLegAngle,  g_lowerBackAngle, false);
}

// Draw a 3-joint leg: upper, lower, hoof 
function drawLeg(x, y, z, upperAngle, lowerAngle, isFront) {
  // Upper leg
  var upperMat = new Matrix4();
  upperMat.translate(x, y, z);
  upperMat.rotate(upperAngle, 0, 0, 1);

  var upper = new Cube();
  upper.color = PIG_DARK_PINK;
  upper.matrix = new Matrix4(upperMat);
  upper.matrix.scale(0.12, 0.18, 0.12);
  upper.render();

  // Lower leg — pivot at bottom of upper
  var lowerMat = new Matrix4(upperMat);
  lowerMat.translate(0, -0.18, 0);
  lowerMat.rotate(lowerAngle, 0, 0, 1);  // knee bend

  var lower = new Cube();
  lower.color = PIG_PINK;
  lower.matrix = new Matrix4(lowerMat);
  lower.matrix.scale(0.11, 0.16, 0.11);
  lower.render();

  // Hoof — third joint, slight outward angle
  var hoofMat = new Matrix4(lowerMat);
  hoofMat.translate(0, -0.08, -0.01);
  hoofMat.rotate(isFront ? 5 : -5, 0, 0, 1);

  var hoof = new Cube();
  hoof.color = PIG_HOOF;
  hoof.matrix = new Matrix4(hoofMat);
  hoof.matrix.scale(0.13, 0.07, 0.13);
  hoof.render();
}

// Draw an eye 
function drawEye(headMat, isRight) {
  var eye = new Cube();
  eye.color = PIG_EYE;
  eye.matrix = new Matrix4(headMat);
  var zOff = isRight ? 0.19 : 0.04;
  eye.matrix.translate(0.30, 0.14, zOff);
  eye.matrix.scale(0.04, 0.05, 0.04);
  eye.render();
}

//  Draw a nostril 
function drawNostril(headMat, zOffset) {
  var n = new Cube();
  n.color = PIG_NOSTRIL;
  n.matrix = new Matrix4(headMat);
  n.matrix.translate(0.37, 0.06, 0.12 + zOffset);
  n.matrix.scale(0.025, 0.025, 0.025);
  n.render();
}

// Draw one ear (2 joints: base + tip) 
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