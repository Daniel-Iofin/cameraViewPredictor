let vertices = [new Vertex(0, 10, 40), new Vertex(1, 20, 50), new Vertex(2, 40, 40), new Vertex(3, 50, 40)];
let edges = [new Edge(0, 0, 2), new Edge(1, 1, 3)];
let camera = new Camera(0, 9, 10, Math.PI*1/4, Math.PI*1/2);
let camera2 = new Camera(0, 4, 5, Math.PI*1/4+0.1, Math.PI*1/2);
let cameratest = new Camera(0, 20, 15, Math.PI*1/4+0.5, Math.PI*1/2);

import { writeFile } from 'fs';
import Vertex from './geometries/vertex.js';
import Edge from './geometries/edge.js';
import Equation from './geometries/equation.js';
import Camera from './camera/camera.js';

let nextVertexId = 4;
let nextEdgeId = 2;

function mod(n, m) {
    return ((n % m) + m) % m;
}

function getVertexAngles(vertices, camera) {
    vertices.forEach(vertex => {
        let deltaX = vertex.x - camera.x;
        let deltaY = vertex.y - camera.y;

        let angleFromHorizontal = Math.atan(deltaY/deltaX);
        let angleFromCameraCenter = camera.direction-Math.abs(angleFromHorizontal);

        vertex.setCameraAngle(angleFromCameraCenter)
    });
    return vertices;
}

function orderEdges(vertices, edges) {
    edges.sort((a, b) => a.getLeftVertexAngle(vertices) - b.getLeftVertexAngle(vertices));
    return edges;
}

function findFrontEdge(camera, angle, vertices, edges) {
    const cameraX = camera.x;
    const cameraY = camera.y;
    const m = 1/Math.atan(angle);
    let b = cameraY-m*cameraX;
    if (m==Infinity) {
        b = camera.x;
    }
    const cameraEquation = new Equation(m, b)

    const edgeProjections = edges.map(edge => {
        const vertex1 = vertices.find(v => v.id === edge.vertex1Id);
        const vertex2 = vertices.find(v => v.id === edge.vertex2Id); 

        const edgeEquation = new Equation().generate(vertex1, vertex2);
        const intersection = cameraEquation.intersection(edgeEquation);
        const distance = Math.pow(Math.pow((intersection.x-cameraX), 2)+Math.pow((intersection.y-cameraY), 2), 0.5)
        return {
            id: edge.id,
            projection: distance
        };
    });

    if (edgeProjections.length === 0) {
        return null;
    }

    const frontEdge = edgeProjections.reduce((front, edge) => {
        return edge.projection < front.projection ? edge : front;
    });

    return frontEdge;
}

function getView(edges, vertices, camera) {
    let view = [];

    vertices.forEach((vertex) => {
        let cameraAngle = vertex.cameraAngle;
        let activeEdges = [];
        
        edges.forEach((edge) => {
            let vertex1 = vertices.find(v => v.id === edge.vertex1Id);
            let vertex2 = vertices.find(v => v.id === edge.vertex2Id); 

            if (vertex1.cameraAngle <= cameraAngle && vertex2.cameraAngle >= cameraAngle) {
                activeEdges.push(edge);
            }
        });

        let trueAngle = camera.direction + cameraAngle;
        
        let frontEdge = findFrontEdge(camera, trueAngle, vertices, activeEdges);
        
        view.push([cameraAngle, frontEdge ? frontEdge.id : null]);
    });

    return view;
}




function getViewEdges(vertices, edges, camera) {
    vertices = vertices.sort((a, b) => a.cameraAngle - b.cameraAngle);
    edges = orderEdges(vertices, edges);
    let view = getView(edges, vertices, camera)

    let colorView = []
    view.forEach((element) => {
        let edgeId = element[1];
        let adjustedView = (element[0]+camera.angle/2)/camera.angle;

        if (adjustedView<0) {adjustedView=0}
        if (adjustedView>1) {adjustedView=1}

        colorView.push([adjustedView, edges.find(e => e.id === edgeId).color])
    })
    
    return colorView
}

class Simulate2D {
    constructor(vertices, edges, camera) {
        this.vertices = vertices;
        this.edges = edges;
        this.camera = camera;
    }

    predict() {
        this.vertices = getVertexAngles(this.vertices, this.camera); // angle each vertex is at from centerline of camera view
        const view = getViewEdges(this.vertices, this.edges, this.camera);  // Which edge is seen for which angle
        return view;
    }
}

const content = [];
const edgeArrays = []
edges.forEach((edge) => {
    try {
        let x1Vertex = vertices.find(vertex => vertex.id == edge.vertex1Id)
        let y1Vertex = vertices.find(vertex => vertex.id == edge.vertex1Id);
        let x2Vertex = vertices.find(vertex => vertex.id == edge.vertex2Id);
        let y2Vertex = vertices.find(vertex => vertex.id == edge.vertex2Id);
        let edgeArray = [[x1Vertex.x, y1Vertex.y], [x2Vertex.x, y2Vertex.y], edge.color]
        edgeArrays.push(edgeArray)
    } catch {
    }
})
content.push(edgeArrays);

function getCameraContent(camera) {
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
                return cameraEquation_equationTop_intersection; 
            }
            return cameraEquation_equationBottom_intersection;
        }

        if (cameraSlope === 0) {
            if (quadrant==1) {
                return cameraEquation_equationRight_intersection;
            }
            return cameraEquation_equationLeft_intersection;
        }

        if (quadrant === 1) {
            if (isLeftIntersectionValid && isTopIntersectionValid) {
                return (cameraEquation_equationLeft_intersection.y <= 64) ? cameraEquation_equationLeft_intersection : cameraEquation_equationTop_intersection;
            }
        } else if (quadrant === 2) {
            if (isLeftIntersectionValid && isBottomIntersectionValid) {
                return (cameraEquation_equationLeft_intersection.y >=0) ? cameraEquation_equationLeft_intersection : cameraEquation_equationBottom_intersection;
            }
        } else if (quadrant === 3) {
            if (isRightIntersectionValid && isBottomIntersectionValid) {
                return (cameraEquation_equationRight_intersection.y >= 0) ? cameraEquation_equationRight_intersection : cameraEquation_equationBottom_intersection;
            }
        } else if (quadrant === 4) {
            if (isRightIntersectionValid && isTopIntersectionValid) {
                return (cameraEquation_equationRight_intersection.y <= 64) ? cameraEquation_equationRight_intersection : cameraEquation_equationTop_intersection;
            }
        }

        if (Number.isNaN(cameraEquation_equationLeft_intersection) && Number.isNaN(cameraEquation_equationRight_intersection)) {
            if (cameraEquation.m === Infinity || cameraEquation.m > 0) {
                return cameraEquation_equationTop_intersection;
            }
            return cameraEquation_equationBottom_intersection;
        }

        if (isBottomIntersectionValid && isTopIntersectionValid) {
            return (cameraEquation_equationBottom_intersection.y >= 0) ? cameraEquation_equationBottom_intersection : cameraEquation_equationTop_intersection;
        }

        return null;
    }

    function getQuadrant(cameraSlope) {
        let normalizedSlope = cameraSlope % (2 * Math.PI);
        if (normalizedSlope < 0) {
            normalizedSlope += 2 * Math.PI;
        }

        if (normalizedSlope >= 0 && normalizedSlope < Math.PI / 2) {
            return 4;
        } else if (normalizedSlope >= Math.PI / 2 && normalizedSlope < Math.PI) {
            return 1;
        } else if (normalizedSlope >= Math.PI && normalizedSlope < 3 * Math.PI / 2) {
            return 2;
        } else if (normalizedSlope >= 3 * Math.PI / 2 && normalizedSlope < 2 * Math.PI) {
            return 3;
        } else {
            return 'Undefined';
        }
    }

    let cameraAngleLeft = camera.direction+camera.angle/2;
    let cameraAngleRight = camera.direction-camera.angle/2;

    let cameraEquationLeft_equationTop_intersection = cameraEquationLeft.intersection(equationTop);
    let cameraEquationLeft_equationBottom_intersection = cameraEquationLeft.intersection(equationBottom);
    let cameraEquationLeft_equationLeft_intersection = cameraEquationLeft.intersection(equationLeft);
    let cameraEquationLeft_equationRight_intersection = cameraEquationLeft.intersection(equationRight);

    let intersectionCameraLeft = intersectionWithBound(getQuadrant(cameraAngleLeft), cameraEquationLeft, cameraEquationLeft_equationTop_intersection, cameraEquationLeft_equationBottom_intersection, cameraEquationLeft_equationLeft_intersection, cameraEquationLeft_equationRight_intersection)

    let cameraEquationRight_equationTop_intersection = cameraEquationRight.intersection(equationTop);
    let cameraEquationRight_equationBottom_intersection = cameraEquationRight.intersection(equationBottom);
    let cameraEquationRight_equationLeft_intersection = cameraEquationRight.intersection(equationLeft);
    let cameraEquationRight_equationRight_intersection = cameraEquationRight.intersection(equationRight);

    let intersectionCameraRight = intersectionWithBound(getQuadrant(cameraAngleRight), cameraEquationRight, cameraEquationRight_equationTop_intersection, cameraEquationRight_equationBottom_intersection, cameraEquationRight_equationLeft_intersection, cameraEquationRight_equationRight_intersection)

    let cameraContent = [[[camera.x, camera.y], [intersectionCameraLeft.x, intersectionCameraLeft.y], '255,0,0'], [[camera.x, camera.y], [intersectionCameraRight.x, intersectionCameraRight.y], '255,0,0']]
    content.push(cameraContent);
}

function getViewText(view) {
    let result = [];
    if (view.length === 0) return "\n";
    
    // Add initial white segment if first point isn't at 0
    if (view[0][0] > 0) {
        result.push([0, view[0][0], '0,0,0']);
    }
    
    // Process segments based on color changes
    for (let i = 0; i < view.length - 1; i++) {
        // If next point has same color, continue looking ahead
        let endIndex = i + 1;
        while (endIndex < view.length - 1 && view[endIndex][1] === view[endIndex + 1][1]) {
            endIndex++;
        }
        
        result.push([view[i][0], view[endIndex][0], view[endIndex][1]]);
        i = endIndex - 1; // Skip the points we've already processed
    }
    
    // Add final white segment if last point isn't at 1
    if (view[view.length - 1][0] < 1) {
        result.push([view[view.length - 1][0], 1, '0,0,0']);
    }
    return result;
}

function getCameraView(camera) {
    let simulation = new Simulate2D(vertices, edges, camera);
    let view = simulation.predict();
    getCameraContent(camera);
    return getViewText(view);
}

let views = [getCameraView(camera), getCameraView(camera2), getCameraView(cameratest)]
content.push(views)

console.log(JSON.stringify(content))
writeFile('scene.txt', JSON.stringify(content), (err) => {
    if (err) {
        console.error('An error occurred while writing to the file:', err);
    } else {
        console.log('File has been written successfully.');
    }
});

// Get camera view and determine viewing lines
let cameraView = getCameraView(camera);
let camera2View = getCameraView(camera2);

let viewingLinesCamera = new Map();
cameraView.forEach(segment => {
    if (segment[2]!='0,0,0') {
        let BaseAngle = camera.direction+camera.angle/2
        let segmentAngles = [BaseAngle-segment[0]*camera.angle, BaseAngle-segment[1]*camera.angle]
        let segmentSlopes = segmentAngles.map(angle => Math.tan(angle))
        let boundaries = segmentSlopes.map(slope => {
            return new Equation(slope, camera.y-slope*camera.x);
        });
        viewingLinesCamera.set(segment[2], boundaries);
    }
});

let viewingLinesCamera2 = new Map();
camera2View.forEach(segment => {
    if (segment[2]!='0,0,0') {
        let BaseAngle = camera2.direction+camera2.angle/2
        let segmentAngles = [BaseAngle-segment[0]*camera2.angle, BaseAngle-segment[1]*camera2.angle]
        let segmentSlopes = segmentAngles.map(angle => Math.tan(angle))
        let boundaries = segmentSlopes.map(slope => {
            return new Equation(slope, camera2.y-slope*camera2.x);
        });
        viewingLinesCamera2.set(segment[2], boundaries);
    }
});

let predictedVertices = [];
let predictedEdges = [];

for (let [key, value] of viewingLinesCamera) {
    if (viewingLinesCamera2.has(key)) {
        let camera1Boundaries = value;
        let camera2Boundaries = viewingLinesCamera2.get(key);

        let leftIntersect = camera1Boundaries[0].intersection(camera2Boundaries[0]);
        let rightIntersect = camera1Boundaries[1].intersection(camera2Boundaries[1]);
        console.log(key, leftIntersect, rightIntersect)
        predictedVertices.push(new Vertex(nextVertexId, leftIntersect.x, leftIntersect.y));
        predictedVertices.push(new Vertex(nextVertexId+1, rightIntersect.x, rightIntersect.y));
        predictedEdges.push(new Edge(nextEdgeId, nextVertexId, nextVertexId+1, key));
        nextVertexId+=2;
    }
}

console.log(predictedVertices, predictedEdges)