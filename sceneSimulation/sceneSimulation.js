import { writeFile } from 'fs';
import Vertex from './geometries/vertex.js';
import Edge from './geometries/edge.js';
import Equation from './geometries/equation.js';
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

function orderEdges(vertices, edges) {
    edges.sort((a, b) => a.getLeftVertexAngle(vertices) - b.getLeftVertexAngle(vertices));
    return edges;
}

function createVertex(id, intersection, camera) {
    let deltaX = intersection.x - camera.x;
    let deltaY = intersection.y - camera.y;

    let angleFromHorizontal = Math.atan(deltaX/deltaY); // Calculate complementary angle --> angle for camera facing forward
    let angleFromCameraCenter = angleFromHorizontal - camera.direction;

    let newVertex = new Vertex(id, intersection.x, intersection.y) // write to own function
    newVertex.setCameraAngle(angleFromCameraCenter);
    return newVertex;
}

function trimEdges(vertices, edges, camera) {
    let {cameraEquationLeft, cameraEquationRight} = camera.equations();
    for (let edge of edges) {
        let vertex1 = vertices.find(vertex => vertex.id == edge.vertex1Id);
        let vertex2 = vertices.find(vertex => vertex.id == edge.vertex2Id);
        let edgeEquation = new Equation(NaN, NaN)
        edgeEquation = edgeEquation.generate(vertex1, vertex2);

        let leftCameraBoundIntersection = edgeEquation.intersection(cameraEquationLeft);
        if (leftCameraBoundIntersection!=NaN) {
            if ((leftCameraBoundIntersection.x>0 && leftCameraBoundIntersection.x<1024) && (leftCameraBoundIntersection.y>0 && leftCameraBoundIntersection.y<1024)) {
                let id = vertices.reduce((max, vertex) => (vertex.id > max.id ? vertex : max), vertices[0]).id+1;
                let newVertex = createVertex(id, leftCameraBoundIntersection, camera);
                console.log(newVertex)
            }
        } else {
            let rightCameraBoundIntersection = edgeEquation.intersection(cameraEquationRight);
        }
    }
}

function getViewEdges(vertices, edges, camera) {
    vertices = vertices.sort((a, b) => a.cameraAngle - b.cameraAngle);
    let orderedEdges = orderEdges(vertices, edges);
    let trimmedEdges = trimEdges(vertices, edges, camera);
    return -1;
}

class Simulate2D {
    constructor(vertices, edges, camera) {
        this.vertices = vertices;
        this.edges = edges;
        this.camera = camera;
    }

    display() {

    }

    predict() {
        this.vertices = getVertexAngles(this.vertices, this.camera); // angle each vertex is at from centerline of camera view
        const viewPartition = getViewEdges(this.vertices, this.edges, this.camera);  // Which edge is seen for which angle
    }
}

let vertices = [new Vertex(0, 10, 40), new Vertex(1, 20, 50), new Vertex(2, 40, 40), new Vertex(3, 50, 40)];
let edges = [new Edge(0, 0, 2), new Edge(1, 1, 3)];
let camera = new Camera(0, 1, 1, Math.PI/4, Math.PI/2);
let simulation = new Simulate2D(vertices, edges, camera);
simulation.display();
simulation.predict();


let content = "";
edges.forEach((edge) => {
    let x1Vertex = vertices.find(vertex => vertex.id == edge.vertex1Id)
    let y1Vertex = vertices.find(vertex => vertex.id == edge.vertex1Id);
    let x2Vertex = vertices.find(vertex => vertex.id == edge.vertex2Id);
    let y2Vertex = vertices.find(vertex => vertex.id == edge.vertex2Id);
    let edgeText = `${x1Vertex.x},${y1Vertex.y};${x2Vertex.x},${y2Vertex.y};${edge.color}\n`;
    content+=edgeText;
})
content = content.slice(0,-2)

writeFile('scene.txt', content, (err) => {
    if (err) {
        console.error('An error occurred while writing to the file:', err);
    } else {
        console.log('File has been written successfully.');
    }
});