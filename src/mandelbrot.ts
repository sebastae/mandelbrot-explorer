
// @ts-ignore
import mandelbrotFragmentShader from './shaders/mandelbrot.frag';
// @ts-ignore
import mandelbrotVertexShader from './shaders/mandelbrot.vert';

import { mat4 } from 'gl-matrix';

export default class Mandelbrot {
    private gl: WebGLRenderingContext;
    // @ts-ignore
    private fragmentShader: WebGLFragmentShader;
    // @ts-ignore
    private vertexShader: WebGLVertexShader;
    private program?: WebGLProgram;
    private mvMatrix?: Float32Array;
    private pMatrix?: Float32Array;
    private positionBuffer?: WebGLBuffer;


    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;

        this.fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, mandelbrotFragmentShader);
        this.vertexShader = this.createShader(this.gl.VERTEX_SHADER, mandelbrotVertexShader);

        this.init();
    }

    private createShader(type: number, source: string): WebGLShader {
        const shader = this.gl.createShader(type);
        if (shader) {
            this.gl.shaderSource(shader, source);
            this.gl.compileShader(shader);
            const compiled = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
            if (!compiled) {
                const error = this.gl.getShaderInfoLog(shader);
                console.error(error);
                this.gl.deleteShader(shader);
                throw error;
            }
            return shader;
        } else {
            throw "Shader creation failed";
        }
    }

    private createPerspectiveMatrix(fov: number): mat4 {
        const width = this.gl.canvas.width;
        const height = this.gl.canvas.height;
        const aspect = width / height;
        const fovRadians = fov * Math.PI / 180;
        const zNear = 0.01;
        const zFar = 100.0;
        const matrix = mat4.create();

        mat4.perspective(matrix, fovRadians, aspect, zNear, zFar);

        return matrix;
    }

    private createModelViewMatrix(): mat4 {
        const matrix = mat4.create();
        mat4.translate(matrix, matrix, [0.0, 0.0, -2.0]);
        return matrix;
    }

    private init() {
        const program = this.gl.createProgram();

        if (program) {
            this.program = program;
        } else {
            console.error("Program creation failed");
            throw "Program creation failed";
        }

        // Init shaders
        this.gl.attachShader(this.program, this.vertexShader);
        this.gl.attachShader(this.program, this.fragmentShader);
        this.gl.linkProgram(this.program);

        // Error checking
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            const error = this.gl.getProgramInfoLog(this.program);
            console.error(error);
            this.gl.deleteProgram(this.program);
            throw error;
        }

        // Init drawing
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);

        // Init plane and buffers
        const positionBuffer = this.gl.createBuffer();
        if (positionBuffer) {
            this.positionBuffer = positionBuffer;
        } else {
            console.error("Position buffer creation failed");
            throw "Position buffer creation failed";
        }



        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);


        // Init attributes
        const attribLocation = this.gl.getAttribLocation(this.program, "aVertexPosition");
        this.gl.vertexAttribPointer(attribLocation, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(attribLocation);

        this.gl.useProgram(this.program);

    }

    public update(view: { x0: number, y0: number, x1: number, y1: number }) {

        if (!this.program) {
            console.error("Program not initialized");
            throw "Program not initialized";
        }

        const height = this.gl.canvas.height;
        const width = this.gl.canvas.width;

        const adjusted = this.gl.canvas.width / this.gl.canvas.height;
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
            -adjusted, -1.0,
            adjusted, -1.0,
            -adjusted, 1.0,
            adjusted, 1.0,
        ]), this.gl.STATIC_DRAW);

        const mvMatrix = this.createModelViewMatrix();
        const pMatrix = this.createPerspectiveMatrix(45);

        this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.program, "uPMatrix"), false, pMatrix);
        this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.program, "uMVMatrix"), false, mvMatrix);
        this.gl.uniform2fv(this.gl.getUniformLocation(this.program, "u_resolution"), [width, height]);
        this.gl.uniform4fv(this.gl.getUniformLocation(this.program, "u_view"), [view.x0, view.y0, view.x1, view.y1]);


        this.gl.clear(this.gl.COLOR_BUFFER_BIT)
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    }

}