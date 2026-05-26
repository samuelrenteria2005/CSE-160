class Camera {
  constructor() {
    this.eye = new Vector3([0, 0, 3]);
    this.at  = new Vector3([0, 0, 2]);
    this.up  = new Vector3([0, 1, 0]);
  }

  _getDir() {
    // Always recompute a clean normalized direction
    var f = new Vector3([
      this.at.elements[0] - this.eye.elements[0],
      this.at.elements[1] - this.eye.elements[1],
      this.at.elements[2] - this.eye.elements[2]
    ]);
    f.normalize();
    return f;
  }

  forward() {
    var f = this._getDir();
    var dx = f.elements[0] * 0.2;
    var dz = f.elements[2] * 0.2;
    this.eye.elements[0] += dx;
    this.eye.elements[2] += dz;
    this.at.elements[0]  += dx;
    this.at.elements[2]  += dz;
  }

  back() {
    var f = this._getDir();
    var dx = f.elements[0] * 0.2;
    var dz = f.elements[2] * 0.2;
    this.eye.elements[0] -= dx;
    this.eye.elements[2] -= dz;
    this.at.elements[0]  -= dx;
    this.at.elements[2]  -= dz;
  }

  left() {
    var f = this._getDir();
    var s = Vector3.cross(f, this.up);
    s.normalize();
    var dx = s.elements[0] * 0.2;
    var dz = s.elements[2] * 0.2;
    this.eye.elements[0] -= dx;
    this.eye.elements[2] -= dz;
    this.at.elements[0]  -= dx;
    this.at.elements[2]  -= dz;
  }

  right() {
    var f = this._getDir();
    var s = Vector3.cross(f, this.up);
    s.normalize();
    var dx = s.elements[0] * 0.2;
    var dz = s.elements[2] * 0.2;
    this.eye.elements[0] += dx;
    this.eye.elements[2] += dz;
    this.at.elements[0]  += dx;
    this.at.elements[2]  += dz;
  }

  panLeft(angleDeg) {
    var f = this._getDir();
    var rotMat = new Matrix4();
    rotMat.setRotate(angleDeg, 0, 1, 0);
    var f_rotated = rotMat.multiplyVector3(f);
    this.at = new Vector3([
      this.eye.elements[0] + f_rotated.elements[0],
      this.eye.elements[1] + f_rotated.elements[1],
      this.eye.elements[2] + f_rotated.elements[2]
    ]);
  }

  panRight(angleDeg) {
    this.panLeft(-angleDeg);
  }

  panUp(angleDeg) {
    var f = this._getDir();
    var s = Vector3.cross(f, this.up);
    s.normalize();
    var rotMat = new Matrix4();
    rotMat.setRotate(angleDeg, s.elements[0], s.elements[1], s.elements[2]);
    var f_rotated = rotMat.multiplyVector3(f);
    this.at = new Vector3([
      this.eye.elements[0] + f_rotated.elements[0],
      this.eye.elements[1] + f_rotated.elements[1],
      this.eye.elements[2] + f_rotated.elements[2]
    ]);
  }
}