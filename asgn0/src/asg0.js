function main() {
  var canvas = document.getElementById('example');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawVector(v, color) {
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');

  ctx.beginPath();
  ctx.moveTo(200, 200);

  var x = v.elements[0] * 20;
  var y = v.elements[1] * 20;

  ctx.lineTo(200 + x, 200 - y);
  ctx.strokeStyle = color;
  ctx.stroke();
}

function angleBetween(v1, v2) {
  let dot = Vector3.dot(v1, v2);
  let magnitudes = v1.magnitude() * v2.magnitude();
  let cosAlpha = dot / magnitudes;

  if (cosAlpha > 1) cosAlpha = 1;
  if (cosAlpha < -1) cosAlpha = -1;

  let angleRadians = Math.acos(cosAlpha);
  let angleDegrees = angleRadians * 180 / Math.PI;
  return angleDegrees;
}

function areaTriangle(v1, v2) {
  let crossProduct = Vector3.cross(v1, v2);
  let area = crossProduct.magnitude() / 2;
  return area;
}

function handleDrawEvent() {
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  var v1 = new Vector3([
    parseFloat(document.getElementById('xCoord1').value),
    parseFloat(document.getElementById('yCoord1').value),
    0
  ]);

  var v2 = new Vector3([
    parseFloat(document.getElementById('xCoord2').value),
    parseFloat(document.getElementById('yCoord2').value),
    0
  ]);

  drawVector(v1, "red");
  drawVector(v2, "blue");
}

function handleDrawOperationEvent() {
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  var v1 = new Vector3([
    parseFloat(document.getElementById('xCoord1').value),
    parseFloat(document.getElementById('yCoord1').value),
    0
  ]);
  drawVector(v1, "red");

  var v2 = new Vector3([
    parseFloat(document.getElementById('xCoord2').value),
    parseFloat(document.getElementById('yCoord2').value),
    0
  ]);
  drawVector(v2, "blue");

  var op = document.getElementById('operationSelect').value;
  var s = parseFloat(document.getElementById('scalarInput').value);

  if (op === "add") {
    let v3 = new Vector3([...v1.elements]);
    v3.add(v2);
    drawVector(v3, "green");

  } else if (op === "sub") {
    let v3 = new Vector3([...v1.elements]);
    v3.sub(v2);
    drawVector(v3, "green");

  } else if (op === "mul") {
    let v3 = new Vector3([...v1.elements]);
    let v4 = new Vector3([...v2.elements]);
    v3.mul(s);
    v4.mul(s);
    drawVector(v3, "green");
    drawVector(v4, "green");

  } else if (op === "div") {
    let v3 = new Vector3([...v1.elements]);
    let v4 = new Vector3([...v2.elements]);
    v3.div(s);
    v4.div(s);
    drawVector(v3, "green");
    drawVector(v4, "green");

  } else if (op === "magnitude") {
    console.log("Magnitude v1:", v1.magnitude());
    console.log("Magnitude v2:", v2.magnitude());

  } else if (op === "normalize") {
    let v3 = new Vector3([...v1.elements]);
    let v4 = new Vector3([...v2.elements]);
    v3.normalize();
    v4.normalize();
    drawVector(v3, "green");
    drawVector(v4, "green");

  } else if (op === "angle") {
    console.log("Angle between v1 and v2:", angleBetween(v1, v2));

  } else if (op === "area") {
    console.log("Area of the triangle:", areaTriangle(v1, v2));
  }
}