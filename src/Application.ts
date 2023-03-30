import { Engine, Mouse, Vector } from 'matter-js';
import { Scene, WebGLRenderer } from 'three';

export class Application {
    public readonly renderer: WebGLRenderer;
    public readonly scene: Scene;
    public readonly physics: Engine;
    public readonly mouse: Mouse;

    public constructor() {
        /**
         * Renderer, scene
         */
        this.renderer = new WebGLRenderer();
        this.scene = new Scene();

        document.body.style.margin = '0';
        document.body.style.overflow = 'hidden';

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        /**
         * Physics
         */
        this.physics = Engine.create({
            gravity: { x: 0, y: 0.0 },
        });

        /**
         * Mouse
         */
        this.mouse = Mouse.create(this.renderer.domElement as unknown as HTMLElement);
        Mouse.setOffset(this.mouse, Vector.mult(this.scene.position, -1));
    }
}
