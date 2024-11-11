import Equation from '../geometries/equation.js';

export default class Camera {
    constructor(id, x, y, direction, viewAngle) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.angle = viewAngle;
    }

    equations() {
        const epsilon = 1e-10; // Small tolerance value

        let directionLeft = this.direction+this.angle/2;
        let directionRight = this.direction-this.angle/2;
        
        let slopeLeft;
        if (Math.abs(directionLeft%Math.PI - Math.PI/2) < epsilon) {
            slopeLeft = Infinity;
        } else {
            slopeLeft = Math.tan(directionLeft);
        }
        if (slopeLeft==0 && directionLeft==0) {
            slopeLeft=epsilon;
        }
        let slopeRight;
        if (Math.abs(directionRight%Math.PI/2 - Math.PI/2) < epsilon) {
            slopeRight = Infinity;
        } else {
            slopeRight = Math.tan(directionRight);
        }
        if (slopeRight==0 && directionRight==0) {
            slopeRight=epsilon;
        }

        let interceptLeft;
        if (slopeLeft==Infinity) {
            interceptLeft = this.x; // Vertical line, represents x value
        } else {
            if (this.x==0) {
                interceptLeft = this.y;
            } else {
                interceptLeft = this.y-slopeLeft*this.x;
            }
        }
        let interceptRight;
        if (slopeRight==Infinity) {
            interceptLeft = this.x
        } else {
            if (this.x==0) {
                interceptRight = this.y;
            } else {
                interceptRight = this.y-slopeRight*this.x;
            }
        }

        return {"cameraEquationLeft": new Equation(slopeLeft, interceptLeft), "cameraEquationRight": new Equation(slopeRight, interceptRight)};
    }
}