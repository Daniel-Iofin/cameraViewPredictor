import { writeFile } from 'fs';
import Vertex from './geometries/vertex.js';
import Edge from './geometries/edge.js';
import Equation from './geometries/equation.js';
import Camera from './camera/camera.js';
import { isArrayBufferView } from 'util/types';

let nextEdgeId=0;

function mod(n, m) {
    return ((n % m) + m) % m;
}

function getVertexAngles(vertices, camera) {
    vertices.forEach(vertex => {
        let deltaX = vertex.x - camera.x;
        let deltaY = vertex.y - camera.y;

        let angleFromHorizontal = Math.atan(deltaX/deltaY);
        let angleFromCameraCenter = angleFromHorizontal - camera.direction;

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
        colorView.push([element[0], edges.find(e => e.id === edgeId).color])
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

let vertices = [new Vertex(0, 10, 40), new Vertex(1, 20, 50), new Vertex(2, 40, 40), new Vertex(3, 50, 40)];
let edges = [new Edge(0, 0, 2), new Edge(1, 1, 3)];
let camera = new Camera(0, 10, 10, Math.PI/4, Math.PI/2);
let simulation = new Simulate2D(vertices, edges, camera);

nextEdgeId = 4;

let view = simulation.predict();

let normedView = []
console.log(view)
view.forEach((element) => {
    normedView.push([(camera.angle/2+element[0])/camera.angle, element[1]])
})


let content = "";
edges.forEach((edge) => {
    try {
    let x1Vertex = vertices.find(vertex => vertex.id == edge.vertex1Id)
    let y1Vertex = vertices.find(vertex => vertex.id == edge.vertex1Id);
    let x2Vertex = vertices.find(vertex => vertex.id == edge.vertex2Id);
    let y2Vertex = vertices.find(vertex => vertex.id == edge.vertex2Id);
    let edgeText = `${x1Vertex.x},${y1Vertex.y};${x2Vertex.x},${y2Vertex.y};${edge.color}\n`;
    content+=edgeText;
    } catch {
    }
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
        if (isRightIntersectionValid && isTopIntersectionValid) {
            return (cameraEquation_equationRight_intersection.y <= 64) ? cameraEquation_equationRight_intersection : cameraEquation_equationTop_intersection;
        }
    } else if (quadrant === 2) {
        if (isLeftIntersectionValid && isTopIntersectionValid) {
            return (cameraEquation_equationLeft_intersection.y <= 64) ? cameraEquation_equationLeft_intersection : cameraEquation_equationTop_intersection;
        }
    } else if (quadrant === 3) {
        if (isLeftIntersectionValid && isBottomIntersectionValid) {
            return (cameraEquation_equationLeft_intersection.y >= 0) ? cameraEquation_equationLeft_intersection : cameraEquation_equationBottom_intersection;
        }
    } else if (quadrant === 4) {
        if (isRightIntersectionValid && isBottomIntersectionValid) {
            return (cameraEquation_equationRight_intersection.y >= 0) ? cameraEquation_equationRight_intersection : cameraEquation_equationBottom_intersection;
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
        return 1;
    } else if (normalizedSlope >= Math.PI / 2 && normalizedSlope < Math.PI) {
        return 2;
    } else if (normalizedSlope >= Math.PI && normalizedSlope < 3 * Math.PI / 2) {
        return 3;
    } else if (normalizedSlope >= 3 * Math.PI / 2 && normalizedSlope < 2 * Math.PI) {
        return 4;
    } else {
        return 'Undefined';
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


let cameraContent = `${camera.x},${camera.y};${intersectionCameraLeft.x},${intersectionCameraLeft.y};255,0,0\n`+`${camera.x},${camera.y};${intersectionCameraRight.x},${intersectionCameraRight.y};255,0,0`
content += cameraContent

function viewTextFromView(arr) {
    return "\n#"+arr.map(item => item.join(';')).join('\n#');
}
let viewText = viewTextFromView(normedView);

content+=viewText

writeFile('scene.txt', content, (err) => {
    if (err) {
        console.error('An error occurred while writing to the file:', err);
    } else {
        console.log('File has been written successfully.');
    }
});

// TODO: GLOBAL VARIABLE FOR WORLD BOUNDARY