import Vertex from './geometries/vertex.js';
import Edge from './geometries/edge.js';
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

function orderedges(vertices, edges) {
    edges.sort((a, b) => a.getLeftVertexAngle(vertices) - b.getLeftVertexAngle(vertices));
    return edges;
}

function getViewEdges(vertices, edges) {
    vertices = vertices.sort((a, b) => a.cameraAngle - b.cameraAngle);
    const orderededges = orderedges(vertices, edges);
    console.log(orderededges);
    return -1;
}

class Simulate2D {
    constructor(vertices, edges, camera) {
        this.vertices = vertices;
        this.edges = edges;
        this.camera = camera;
    }

    predict() {
        this.vertices = getVertexAngles(this.vertices, this.camera); // angle each vertex is at from centerline of camera view
        const viewPartition = getViewEdges(this.vertices, this.edges);  // Which edge is seen for which angle
    }
}

let vertices = [new Vertex(0, 1, 4), new Vertex(1, 2, 5), new Vertex(2, 4, 4), new Vertex(3, 5, 4)];
let edges = [new Edge(0, 0, 2), new Edge(1, 1, 3)];
let camera = new Camera(0, 1, 1, Math.PI/4, Math.PI/2);

let simulation = new Simulate2D(vertices, edges, camera);
simulation.predict()
