class Triangle{
    constructor(){
      this.type='triangle';
      this.position=[0.0,0.0,0.0];
      this.color = [1.0,1.0,1.0,1.0];
      this.size = 5.0;
    }

    render() {
        var xy = this.position;
        var rgba = this.color;
        var size = this.size;

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniform1f(u_Size, size);

        var d = this.size/200.0;
        drawTriangle( [xy[0], xy[1], xy[0]+d, xy[1], xy[0], xy[1]+d]);
    }
  }


var g_triPosBuffer    = null;
var g_triUVBuffer     = null;
var g_triNormalBuffer = null;

function getTriPosBuffer() {
  if (!g_triPosBuffer) g_triPosBuffer = gl.createBuffer();
  return g_triPosBuffer;
}
function getTriUVBuffer() {
  if (!g_triUVBuffer) g_triUVBuffer = gl.createBuffer();
  return g_triUVBuffer;
}
function getTriNormalBuffer() {
  if (!g_triNormalBuffer) g_triNormalBuffer = gl.createBuffer();
  return g_triNormalBuffer;
}

function drawTriangle(vertices) {
  gl.bindBuffer(gl.ARRAY_BUFFER, getTriPosBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function drawTriangle3D(vertices) {
  var n = vertices.length / 3;

  gl.bindBuffer(gl.ARRAY_BUFFER, getTriPosBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}

function drawTriangle3DUV(vertices, uv) {
  var n = vertices.length / 3;

  gl.bindBuffer(gl.ARRAY_BUFFER, getTriPosBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, getTriUVBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_UV);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}

// Accepts plain arrays OR Float32Arrays. If a Float32Array is passed in,
// it is uploaded directly (no copy / no allocation).
function drawTriangle3DUVNormal(vertices, uv, normals) {
  var vArr  = (vertices instanceof Float32Array) ? vertices : new Float32Array(vertices);
  var uvArr = (uv instanceof Float32Array)       ? uv       : new Float32Array(uv);
  var nArr  = (normals instanceof Float32Array)  ? normals  : new Float32Array(normals);
  var n = vArr.length / 3;

  gl.bindBuffer(gl.ARRAY_BUFFER, getTriPosBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, vArr, gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, getTriUVBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, uvArr, gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_UV);

  gl.bindBuffer(gl.ARRAY_BUFFER, getTriNormalBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, nArr, gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}