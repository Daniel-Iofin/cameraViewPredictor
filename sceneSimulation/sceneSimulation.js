import { writeFile } from 'fs';
import Vertex from './geometries/vertex.js';
import Edge from './geometries/edge.js';
import Equation from './geometries/equation.js';
import Camera from './camera/camera.js';

function mod(n, m) {
    return ((n % m) + m) % m;
}

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


let {cameraEquationLeft, cameraEquationRight} = camera.equations();
let equationTop = new Equation(0, 64);
let equationBottom = new Equation(0, 0);
let equationLeft = new Equation(Infinity, 0);
let equationRight = new Equation(Infinity, 64);

function intersectionWithBound(quadrant, cameraEquation, cameraEquation_equationTop_intersection, cameraEquation_equationBottom_intersection, cameraEquation_equationLeft_intersection, cameraEquation_equationRight_intersection) {
    const isLeftIntersectionValid = !Number.isNaN(cameraEquation_equationLeft_intersection);
    const isRightIntersectionValid = !Number.isNaN(cameraEquation_equationRight_intersection);
    const isTopIntersectionValid = !Number.isNaN(cameraEquation_equationTop_intersection);
    const isBottomIntersectionValid = !Number.isNaN(cameraEquation_equationBottom_intersection);

    let cameraSlope = cameraEquation.m
    if (cameraSlope === Infinity || cameraSlope === -Infinity) {
        if (quadrant==1 || quadrant==2) {
            return cameraEquation_equationTop_intersection; // Right edge for vertical line
        }
        return cameraEquation_equationBottom_intersection; // Left edge for vertical line
    }

    // Handle horizontal line (zero slope)
    if (cameraSlope === 0) {
        if (quadrant==1) {
            return cameraEquation_equationRight_intersection; // Top edge for horizontal line
        }
        return cameraEquation_equationLeft_intersection; // Bottom edge for horizontal line
    }

    if (quadrant === 1) { // First Quadrant: Top and Right
        if (isRightIntersectionValid && isTopIntersectionValid) {
            return (cameraEquation_equationRight_intersection.y <= 64) ? cameraEquation_equationRight_intersection : cameraEquation_equationTop_intersection;
        }
    } else if (quadrant === 2) { // Second Quadrant: Top and Left
        if (isLeftIntersectionValid && isTopIntersectionValid) {
            return (cameraEquation_equationLeft_intersection.y <= 64) ? cameraEquation_equationLeft_intersection : cameraEquation_equationTop_intersection;
        }
    } else if (quadrant === 3) { // Third Quadrant: Bottom and Left
        if (isLeftIntersectionValid && isBottomIntersectionValid) {
            return (cameraEquation_equationLeft_intersection.y >= 0) ? cameraEquation_equationLeft_intersection : cameraEquation_equationBottom_intersection;
        }
    } else if (quadrant === 4) { // Fourth Quadrant: Bottom and Right
        if (isRightIntersectionValid && isBottomIntersectionValid) {
            return (cameraEquation_equationRight_intersection.y >= 0) ? cameraEquation_equationRight_intersection : cameraEquation_equationBottom_intersection;
        }
    }

    // Handle cases where neither border is valid
    if (Number.isNaN(cameraEquation_equationLeft_intersection) && Number.isNaN(cameraEquation_equationRight_intersection)) {
        if (cameraEquation.m === Infinity || cameraEquation.m > 0) {
            return cameraEquation_equationTop_intersection;
        }
        return cameraEquation_equationBottom_intersection;
    }

    // Handle cases for borders without checking quadrant
    if (isBottomIntersectionValid && isTopIntersectionValid) {
        return (cameraEquation_equationBottom_intersection.y >= 0) ? cameraEquation_equationBottom_intersection : cameraEquation_equationTop_intersection;
    }

    return null; // Return null if no valid intersection found
}

function getQuadrant(cameraSlope) {
    // Normalize the slope to be within [0, 2π)
    let normalizedSlope = cameraSlope % (2 * Math.PI);
    if (normalizedSlope < 0) {
        normalizedSlope += 2 * Math.PI; // Ensure it's positive
    }

    // Determine the quadrant based on the normalized slope
    if (normalizedSlope >= 0 && normalizedSlope < Math.PI / 2) {
        return 1; // First Quadrant
    } else if (normalizedSlope >= Math.PI / 2 && normalizedSlope < Math.PI) {
        return 2; // Second Quadrant
    } else if (normalizedSlope >= Math.PI && normalizedSlope < 3 * Math.PI / 2) {
        return 3; // Third Quadrant
    } else if (normalizedSlope >= 3 * Math.PI / 2 && normalizedSlope < 2 * Math.PI) {
        return 4; // Fourth Quadrant
    } else {
        return 'Undefined'; // Should not reach here
    }
}


let cameraSlopeLeft = mod(camera.direction-camera.angle/2, 2*Math.PI)
let cameraSlopeRight = mod(camera.direction-camera.angle/2, 2*Math.PI)

let cameraEquationLeft_equationTop_intersection = cameraEquationLeft.intersection(equationTop);
let cameraEquationLeft_equationBottom_intersection = cameraEquationLeft.intersection(equationBottom);
let cameraEquationLeft_equationLeft_intersection = cameraEquationLeft.intersection(equationLeft);
let cameraEquationLeft_equationRight_intersection = cameraEquationLeft.intersection(equationRight);

let intersectionCameraLeft = intersectionWithBound(getQuadrant(cameraSlopeLeft), cameraEquationLeft, cameraEquationLeft_equationTop_intersection, cameraEquationLeft_equationBottom_intersection, cameraEquationLeft_equationLeft_intersection, cameraEquationLeft_equationRight_intersection)


let cameraEquationRight_equationTop_intersection = cameraEquationRight.intersection(equationTop);
let cameraEquationRight_equationBottom_intersection = cameraEquationRight.intersection(equationBottom);
let cameraEquationRight_equationLeft_intersection = cameraEquationRight.intersection(equationLeft);
let cameraEquationRight_equationRight_intersection = cameraEquationRight.intersection(equationRight);

let intersectionCameraRight = intersectionWithBound(getQuadrant(cameraSlopeRight), cameraEquationRight, cameraEquationRight_equationTop_intersection, cameraEquationRight_equationBottom_intersection, cameraEquationRight_equationLeft_intersection, cameraEquationRight_equationRight_intersection)

console.log(intersectionCameraLeft, intersectionCameraRight);

let cameraContent = `${camera.x},${camera.y};${intersectionCameraLeft.x},${intersectionCameraLeft.y};255,0,0\n`+`${camera.x},${camera.y};${intersectionCameraRight.x},${intersectionCameraRight.y};255,0,0`
content += cameraContent

writeFile('scene.txt', content, (err) => {
    if (err) {
        console.error('An error occurred while writing to the file:', err);
    } else {
        console.log('File has been written successfully.');
    }
});

// TODO: GLOBAL VARIABLE FOR WORLD BOUNDARY