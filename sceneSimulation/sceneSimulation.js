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
    let orderededges = [];

    edges.forEach(edge => {
        let vertex1Id = edge.vertex1Id;
        let vertex1 = vertices.find(vertex => vertex.id == vertex1Id);
        let vertex2Id = edge.vertex2Id;
        let vertex2 = vertices.find(vertex => vertex.id == vertex2Id)

        if (vertex1.cameraAngle<vertex2.cameraAngle) { // bug from here down
            console.log("here")
            orderededges.push(edge);
        } else {
            edge.vertex1Id = vertex2Id;
            edge.vertex2Id = vertex1Id;
            orderededges.push(edge);
        }
    })
    
    return orderededges;
}

function getViewedges(vertices, edges) {
    vertices = vertices.sort((a, b) => a.cameraAngle - b.cameraAngle);
    const orderededges = orderedges(vertices, edges);
    console.log(orderededges);
    return -1;
}

class Simulate2D {
    constructor(vertices, edges, camera) {
        this.vertices = vertices; // {id, x, y}
        this.edges = edges; // {id: {vertex1Id:_, vertex2Id:_}}
        this.camera = camera;
    }

    predict() { // {x, y, angle, sweep}  angle is rotation of camera, sweep is how wide camera sees
        this.vertices = getVertexAngles(this.vertices, this.camera);
        const viewPartition = getViewedges(this.vertices, this.edges);  // Which edge is seen for which angle
    }
}
//getViewedges(0, 0, [[5, 4], [7, 10], [9, 5]], [{"vertex1Id": 7, "vertex2Id": 9},{"vertex1Id": 5, "vertex2Id": 9}])

let vertices = [new Vertex(0, 1, 4), new Vertex(1, 2, 5), new Vertex(2, 4, 4), new Vertex(3, 5, 4)];
let edges = [new Edge(0, 0, 2), new Edge(1, 1, 3)];
let camera = new Camera(0, 1, 1, Math.PI/4, Math.PI/2);

let simulation = new Simulate2D(vertices, edges, camera);
simulation.predict()
