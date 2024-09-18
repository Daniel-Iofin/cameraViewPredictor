import Point from '/vertex.js';
export default class Equation {
    constructor(m, b) {
        this.m = m;
        this.b = b;
    }

    intersection(equation) {
        if (JSON.stringify(equation)==JSON.stringify(this)) {
            return new Equation(this.m, this.b);
        } else if (equation.m==this.m) {
            return NaN;
        }

        let intersectionX = (equation.b-this.b)/(this.m-equation.m);
        let intersectionY = this.m*intersectionX+this.b;

        return Point(intersectionX, intersectionY);
    }
}