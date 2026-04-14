function drawSRStopSign() {

    // --- POLE ---
    gl.uniform4f(u_FragColor, 0.53, 0.53, 0.50, 1.0);
    drawTriangle([-0.04, -0.63,  0.04, -0.63,  0.06, -1.0]);
    drawTriangle([-0.04, -0.63,  0.06, -1.0,  -0.06, -1.0]);
    gl.uniform4f(u_FragColor, 0.37, 0.37, 0.35, 1.0);
    drawTriangle([-0.04, -0.63,  0.04, -0.63,  0.0,  -0.73]);
  
    // --- OCTAGON (red panels) ---
    gl.uniform4f(u_FragColor, 0.89, 0.29, 0.29, 1.0);
    drawTriangle([ 0.0,  0.0, -0.44, 0.50,  0.44, 0.50]);
    drawTriangle([ 0.0,  0.0,  0.44, 0.50,  0.63, 0.28]);
    drawTriangle([ 0.0,  0.0,  0.63, 0.28,  0.63,-0.28]);
    drawTriangle([ 0.0,  0.0,  0.63,-0.28,  0.44,-0.50]);
    gl.uniform4f(u_FragColor, 0.81, 0.25, 0.25, 1.0);
    drawTriangle([ 0.0,  0.0,  0.44,-0.50, -0.44,-0.50]);
    drawTriangle([ 0.0,  0.0, -0.44,-0.50, -0.63,-0.28]);
    drawTriangle([ 0.0,  0.0, -0.63,-0.28, -0.63, 0.28]);
    drawTriangle([ 0.0,  0.0, -0.63, 0.28, -0.44, 0.50]);
  
    // --- S (left side, white) ---
    gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
    // Top cap
    drawTriangle([-0.56, 0.44, -0.20, 0.44, -0.56, 0.34]);
    drawTriangle([-0.20, 0.44, -0.20, 0.34, -0.56, 0.34]);
    // Left top arm
    drawTriangle([-0.56, 0.34, -0.46, 0.34, -0.56, 0.04]);
    drawTriangle([-0.46, 0.34, -0.46, 0.04, -0.56, 0.04]);
    // Middle bar
    drawTriangle([-0.56, 0.07, -0.20, 0.07, -0.56,-0.04]);
    drawTriangle([-0.20, 0.07, -0.20,-0.04, -0.56,-0.04]);
    // Right bottom arm
    drawTriangle([-0.30,-0.04, -0.20,-0.04, -0.20,-0.34]);
    drawTriangle([-0.30,-0.04, -0.30,-0.34, -0.20,-0.34]);
    // Bottom cap
    drawTriangle([-0.56,-0.34, -0.20,-0.34, -0.56,-0.44]);
    drawTriangle([-0.20,-0.34, -0.20,-0.44, -0.56,-0.44]);
  
    // --- R (right side, white) ---
    gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
    // Left spine
    drawTriangle([ 0.10, 0.44,  0.21, 0.44,  0.10,-0.44]);
    drawTriangle([ 0.21, 0.44,  0.21,-0.44,  0.10,-0.44]);
    // Top cap
    drawTriangle([ 0.10, 0.44,  0.50, 0.44,  0.10, 0.34]);
    drawTriangle([ 0.50, 0.44,  0.50, 0.34,  0.10, 0.34]);
    // Right top arm
    drawTriangle([ 0.39, 0.44,  0.50, 0.44,  0.50, 0.04]);
    drawTriangle([ 0.39, 0.44,  0.39, 0.04,  0.50, 0.04]);
    // Middle bar
    drawTriangle([ 0.10, 0.07,  0.50, 0.07,  0.10,-0.04]);
    drawTriangle([ 0.50, 0.07,  0.50,-0.04,  0.10,-0.04]);
    // Diagonal leg
    drawTriangle([ 0.21,-0.04,  0.21,-0.44,  0.50,-0.44]);
  
  }