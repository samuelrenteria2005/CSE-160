var g_cylBuffer = null;

function initCylBuffer() {
  g_cylBuffer = gl.createBuffer();
}

class Cylinder {
  constructor(segments = 12) {
    this.type = 'cylinder';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.segments = segments;
  }

  render() {
    var rgba = this.color;
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    var seg = this.segments;
    var r = 0.5; // radius, centered at 0.5,_,0.5 so it fits [0..1] box
    var cx = 0.5, cz = 0.5;

    if (!g_cylBuffer) initCylBuffer();

    // Top cap (y=1) — lighter shade
    gl.uniform4f(u_FragColor, Math.min(rgba[0]*1.15,1), Math.min(rgba[1]*1.15,1), Math.min(rgba[2]*1.15,1), rgba[3]);
    for (let i = 0; i < seg; i++) {
      let a1 = (i / seg) * 2 * Math.PI;
      let a2 = ((i + 1) / seg) * 2 * Math.PI;
      let x1 = cx + r * Math.cos(a1), z1 = cz + r * Math.sin(a1);
      let x2 = cx + r * Math.cos(a2), z2 = cz + r * Math.sin(a2);
      drawCylTri([cx,1,cz, x1,1,z1, x2,1,z2]);
    }

    // Bottom cap (y=0) — darker shade
    gl.uniform4f(u_FragColor, rgba[0]*.6, rgba[1]*.6, rgba[2]*.6, rgba[3]);
    for (let i = 0; i < seg; i++) {
      let a1 = (i / seg) * 2 * Math.PI;
      let a2 = ((i + 1) / seg) * 2 * Math.PI;
      let x1 = cx + r * Math.cos(a1), z1 = cz + r * Math.sin(a1);
      let x2 = cx + r * Math.cos(a2), z2 = cz + r * Math.sin(a2);
      drawCylTri([cx,0,cz, x2,0,z2, x1,0,z1]);
    }

    // Side faces — two triangles per segment
    for (let i = 0; i < seg; i++) {
      let a1 = (i / seg) * 2 * Math.PI;
      let a2 = ((i + 1) / seg) * 2 * Math.PI;
      // Shade based on angle for a rounded look
      let shade = 0.7 + 0.3 * Math.cos(a1);
      gl.uniform4f(u_FragColor, rgba[0]*shade, rgba[1]*shade, rgba[2]*shade, rgba[3]);

      let x1 = cx + r * Math.cos(a1), z1 = cz + r * Math.sin(a1);
      let x2 = cx + r * Math.cos(a2), z2 = cz + r * Math.sin(a2);
      drawCylTri([x1,0,z1, x2,0,z2, x2,1,z2]);
      drawCylTri([x1,0,z1, x2,1,z2, x1,1,z1]);
    }
  }
}

function drawCylTri(vertices) {
  if (!g_cylBuffer) initCylBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_cylBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}