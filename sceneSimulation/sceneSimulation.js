import Vertex from './geometries/vertex.js';
import Line from './geometries/line.js';
import Camera from './camera/camera.js';

function getVertexAngles(vertices, camera) {
    vertices.forEach(vertex => {
        let deltaX = vertex.x - camera.x;
        let deltaY = vertex.y - camera.y;

        let angleFromHorizontal = Math.atan(deltaX/deltaY); // Calculate complementary angle --> angle for camera facing forward
        let angleFromCameraCenter = angleFromHorizontal - camera.direction;

        vertex.setCameraAngle(angleFromCameraCenter)
    });
    return vertices;
}

function orderLines(vertices, lines) {
    let orderedLines = [];

    lines.forEach(line => {
        let vertex1Id = line.vertex1Id;
        let vertex1 = vertices.find(vertex => vertex.id == vertex1Id);
        let vertex2Id = line.vertex2Id;
        let vertex2 = vertices.find(vertex => vertex.id == vertex2Id)

        if (vertex1.cameraAngle<vertex2.cameraAngle) { // bug from here down
            console.log("here")
            orderedLines.push(line);
        } else {
            line.vertex1Id = vertex2Id;
            line.vertex2Id = vertex1Id;
            orderedLines.push(line);
        }
    })
    
    return orderedLines;
}

function getViewLines(vertices, lines) {
    vertices = vertices.sort((a, b) => a.cameraAngle - b.cameraAngle);
    const orderedLines = orderLines(vertices, lines);
    console.log(orderedLines);
    return -1;
}

class Simulate2D {
    constructor(vertices, lines, camera) {
        this.vertices = vertices; // {id, x, y}
        this.lines = lines; // {id: {vertex1Id:_, vertex2Id:_}}
        this.camera = camera;
    }

    predict() { // {x, y, angle, sweep}  angle is rotation of camera, sweep is how wide camera sees
        this.vertices = getVertexAngles(this.vertices, this.camera);
        const viewPartition = getViewLines(this.vertices, this.lines);  // Which line is seen for which angle
    }
}
//getViewLines(0, 0, [[5, 4], [7, 10], [9, 5]], [{"vertex1Id": 7, "vertex2Id": 9},{"vertex1Id": 5, "vertex2Id": 9}])

let vertices = [new Vertex(0, 1, 4), new Vertex(1, 2, 5), new Vertex(2, 4, 4), new Vertex(3, 5, 4)];
let lines = [new Line(0, 0, 2), new Line(1, 1, 3)];
let camera = new Camera(0, 1, 1, Math.PI/4, Math.PI/2);

let simulation = new Simulate2D(vertices, lines, camera);
simulation.predict()
