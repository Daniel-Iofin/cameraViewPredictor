export default class Vertex {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.cameraAngle = NaN;
    }

    setCameraAngle(angle) {
        this.cameraAngle = angle;
    }
}